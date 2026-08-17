#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
proxy-rule 规则更新爬虫 (https://github.com/CooperZhuang/proxy-rule)

自动更新 rules/ 目录下的分流规则：

1. rules/teams-us.txt —— 从 Microsoft 365 官方端点 JSON 自动提取
   数据源: https://learn.microsoft.com/office365/enterprise/urls-and-ip-address-ranges
   - 域名: Teams / Common / Skype / Exchange / SharePoint 服务区域
           （覆盖 Teams 本体、登录、OneDrive/SharePoint、Outlook 等依赖）
   - IP  : Teams / Skype 服务区域的媒体与基础网络段
   输出 classical 文本规则集, 在 Clash 中指向: 🇺🇲 美国节点

2. rules/steam-direct.txt —— 本仓库手工维护基础列表 + 上游 Femoon/clash-rules 合并去重
   数据源: https://github.com/Femoon/clash-rules

用法:
    python crawler/update_rules.py              # 全量更新
    python crawler/update_rules.py --skip-teams # 跳过微软端点提取
    python crawler/update_rules.py --skip-steam # 跳过 steam 上游合并
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
RULES_DIR = REPO_ROOT / "rules"

# ---- Microsoft 365 端点 ----
# ClientRequestId 仅需为合法 GUID
TEAMS_JSON_URL = (
    "https://endpoints.office.com/endpoints/worldwide"
    "?ClientRequestId=3f5a1c2e-8b4d-4f6a-9c1e-2d7b0a5e8f31"
)
# 域名覆盖的服务区域（Teams 及其强依赖）
TEAMS_DOMAIN_AREAS = {"Teams", "Common", "Skype", "Exchange", "SharePoint"}
# 仅提取 IP 网段的服务区域（媒体 / 基础网络；Exchange 大段基础设施网段不纳入，保持与手写版一致）
TEAMS_IP_AREAS = {"Teams", "Skype"}

# 证书链校验（CRL/OCSP）端点：不属于 Teams 流量，剔除
CERT_CRL_DOMAINS = {
    "digicert.com", "globalsign.com", "globalsign.net", "identrust.com",
    "letsencrypt.org", "omniroot.com", "public-trust.com", "symcb.com",
    "symcd.com", "verisign.com", "verisign.net", "geotrust.com",
    "entrust.net", "secure.globalsign.com", "msocsp.com",
}

# ---- Surge / Loon 通用格式 ----
# 各规则集在 Surge/Loon 通用格式中的策略名（与 Clash 分组名保持一致）
UNIVERSAL_POLICIES = {
    "teams-us": "🇺🇲 美国节点",
    "steam-direct": "DIRECT",
    "game-cdn-direct": "DIRECT",
    "custom-direct": "DIRECT",
    "custom-fallback": "🐟 兜底分流",
}
UNIVERSAL_DIR = RULES_DIR / "universal"

# ---- Steam 上游 ----
STEAM_UPSTREAMS = [
    "https://raw.githubusercontent.com/Femoon/clash-rules/master/steam.yaml",
    "https://raw.githubusercontent.com/Femoon/clash-rules/main/steam.yaml",
]
# classical 文本规则行（DOMAIN / DOMAIN-SUFFIX / IP-CIDR / IP-CIDR6），兼容带引号的 YAML 值
_RULE_LINE_RE = re.compile(
    r"(?m)^\s*-\s*['\"]?\s*(DOMAIN(?:-SUFFIX)?|IP-CIDR6?)\s*,\s*([^,'\"\s]+)"
)
_HEADER = (
    "# 由 crawler/update_rules.py 自动生成, 请勿手动编辑\n"
    "# 生成时间: {ts} UTC\n"
)


def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _fetch(url: str, timeout: int = 30) -> str:
    resp = requests.get(url, timeout=timeout, headers={"User-Agent": "proxy-rule-updater"})
    resp.raise_for_status()
    return resp.text


def _parse_host(raw: str) -> str | None:
    """从 urls 字段提取主机名：兼容 'https://x/y' 与裸域名，去除通配符前缀。"""
    s = raw.strip().lower()
    if not s:
        return None
    if "://" in s:
        s = urlparse(s).netloc or s
    s = s.lstrip("*.")
    if not s or any(c in s for c in " /?#*"):
        return None
    return s


def _normalize_ip(ip: str) -> str | None:
    """裸 IP 补全掩码：IPv4 -> /32, IPv6 -> /128。"""
    s = ip.strip()
    if not s:
        return None
    if "/" not in s:
        s += "/128" if ":" in s else "/32"
    return s


def _to_universal(line: str, policy: str) -> str | None:
    """Clash classical 规则行 → Surge/Loon 通用格式（带策略，IP 规则追加 no-resolve）。"""
    s = line.strip()
    if s.startswith("IP-CIDR6,") or s.startswith("IP-CIDR,"):
        return f"{s},{policy},no-resolve"
    if s.startswith("DOMAIN-SUFFIX,") or s.startswith("DOMAIN,"):
        return f"{s},{policy}"
    return None  # 注释/空行等跳过


def update_universal() -> None:
    """为每个 Clash 规则集生成 Surge/Loon 通用格式副本。"""
    UNIVERSAL_DIR.mkdir(parents=True, exist_ok=True)
    for name, policy in UNIVERSAL_POLICIES.items():
        src = RULES_DIR / f"{name}.txt"
        if not src.exists():
            print(f"[universal] 跳过缺失的 {name}.txt")
            continue
        out_lines = [
            "# Surge / Loon 通用规则集 (由 crawler/update_rules.py 生成)",
            f"# 来源: rules/{name}.txt   策略: {policy}",
            "# 用法: Surge `Rule Set = <url>`; Loon `RULE-SET,<url>`",
            "",
        ]
        for line in src.read_text(encoding="utf-8").splitlines():
            conv = _to_universal(line, policy)
            if conv:
                out_lines.append(conv)
        dst = UNIVERSAL_DIR / f"{name}.txt"
        dst.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
        print(f"[universal] 已写入 {dst.relative_to(REPO_ROOT)} ({len(out_lines) - 4} 条)")


def _ipv4_sort_key(ip: str) -> tuple:
    try:
        return tuple(int(p) for p in ip.split("/")[0].split("."))
    except ValueError:
        return (0, 0, 0, 0)


def update_teams() -> None:
    print(f"[teams] 拉取 {TEAMS_JSON_URL}")
    data = _fetch(TEAMS_JSON_URL)
    entries = json.loads(data)

    domains: set[str] = set()
    ips_v4: set[str] = set()
    ips_v6: set[str] = set()

    for e in entries:
        area = e.get("serviceArea", "")
        if area in TEAMS_DOMAIN_AREAS:
            for u in e.get("urls", []):
                host = _parse_host(u)
                if host and not any(host == d or host.endswith("." + d) for d in CERT_CRL_DOMAINS):
                    domains.add(host)
        if area in TEAMS_IP_AREAS:
            for ip in e.get("ips", []):
                norm = _normalize_ip(ip)
                if norm:
                    (ips_v6 if ":" in norm else ips_v4).add(norm)

    lines = [_HEADER.format(ts=_now_utc())]
    lines.append(f"# 服务区域(域名): {', '.join(sorted(TEAMS_DOMAIN_AREAS))}")
    lines.append(f"# 服务区域(IP):   {', '.join(sorted(TEAMS_IP_AREAS))}")
    lines.append(f"# 域名 {len(domains)} 条 / IPv4 {len(ips_v4)} 段 / IPv6 {len(ips_v6)} 段")
    lines.append("")
    lines += [f"DOMAIN-SUFFIX,{d}" for d in sorted(domains)]
    lines += [f"IP-CIDR,{ip}" for ip in sorted(ips_v4, key=_ipv4_sort_key)]
    lines += [f"IP-CIDR6,{ip}" for ip in sorted(ips_v6)]

    out = RULES_DIR / "teams-us.txt"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[teams] 已写入 {out.relative_to(REPO_ROOT)} ({len(lines)} 行)")


def update_steam() -> None:
    out = RULES_DIR / "steam-direct.txt"
    base = out.read_text(encoding="utf-8") if out.exists() else ""
    rules: set[str] = set()
    for line in base.splitlines():
        s = line.strip()
        if s and not s.startswith("#") and not s.startswith("payload:"):
            rules.add(s)

    merged = False
    for url in STEAM_UPSTREAMS:
        try:
            print(f"[steam] 拉取 {url}")
            text = _fetch(url)
        except requests.RequestException as e:
            print(f"[steam] 上游不可用({url}): {e}")
            continue
        found = _RULE_LINE_RE.findall(text)
        before = len(rules)
        rules.update(f"{kind},{val}" for kind, val in found)
        print(f"[steam] 上游命中 {len(found)} 条, 新增 {len(rules) - before} 条")
        merged = True
        break

    if not merged:
        print("[steam] 所有上游均不可用, 保留基础列表", file=sys.stderr)

    lines = [_HEADER.format(ts=_now_utc())]
    lines.append("# 基础列表手工维护 + 上游 Femoon/clash-rules 自动合并去重")
    lines.append("")
    lines += sorted(rules)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[steam] 已写入 {out.relative_to(REPO_ROOT)} ({len(rules)} 条规则)")


def main() -> None:
    ap = argparse.ArgumentParser(description="proxy-rule 规则更新爬虫")
    ap.add_argument("--skip-teams", action="store_true", help="跳过微软 365 端点提取")
    ap.add_argument("--skip-steam", action="store_true", help="跳过 steam 上游合并")
    args = ap.parse_args()

    RULES_DIR.mkdir(parents=True, exist_ok=True)

    if not args.skip_teams:
        update_teams()
    if not args.skip_steam:
        update_steam()
    update_universal()  # 始终从当前 Clash 规则集同步 Surge/Loon 通用格式
    print("[done] 更新完成")


if __name__ == "__main__":
    main()
