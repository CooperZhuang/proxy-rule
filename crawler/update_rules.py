#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
proxy-rule 规则更新爬虫 (https://github.com/CooperZhuang/proxy-rule)

自动更新 rules/ 目录下的分流规则（按客户端分专项目录）：

1. rules/clash/teams.txt + office-direct.txt —— 从 Microsoft 365 官方端点 JSON 自动提取
   数据源: https://learn.microsoft.com/office365/enterprise/urls-and-ip-address-ranges
   - teams.txt        : Skype 服务区域（承载 Teams 域名与媒体 IP）+ 手工补充的 Teams 域名
                        输出 classical 文本规则集, 指向代理组 Teams
   - office-direct.txt: Common / Exchange / SharePoint 服务区域（登录、Outlook、SharePoint/OneDrive 等）
                        输出 classical 文本规则集, 指向 DIRECT

2. rules/clash/steam-direct.txt —— 本仓库手工维护基础列表 + 上游 Femoon/clash-rules 合并去重
   数据源: https://github.com/Femoon/clash-rules

3. rules/surge/*.txt —— Surge 专项规则集（内嵌策略, IP 规则追加 no-resolve）
4. rules/loon/*.lsr —— Loon 专项规则集（裸规则, 策略在 [Remote Rule] 导入时用 policy= 指定）

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
# Microsoft 365 端点 JSON 里 Teams 的域名与媒体 IP 都在 Skype 服务区域
TEAMS_AREA_DOMAINS = {"Skype"}
TEAMS_AREA_IPS = {"Skype"}
# 端点清单缺失、但 Teams 客户端会用的域名（手工补充，必须走代理）
TEAMS_EXTRA_DOMAINS = {
    "teams.live.com",                       # Teams 个人版
    "microsoftteams.com",
    "teams.cdn.office.net",                 # Teams 静态资源：office.net 后缀会被 Office 直连规则吃掉，必须显式保留
    "statics.teams.cdn.office.net",
    "teams.events.data.microsoft.com",
}
# 其余 Office 组件走直连（登录 / Exchange / SharePoint/OneDrive）
OFFICE_AREA_DOMAINS = {"Common", "Exchange", "SharePoint"}

# 证书链校验（CRL/OCSP）端点：不属于 Teams 流量，剔除
CERT_CRL_DOMAINS = {
    "digicert.com", "globalsign.com", "globalsign.net", "identrust.com",
    "letsencrypt.org", "omniroot.com", "public-trust.com", "symcb.com",
    "symcd.com", "verisign.com", "verisign.net", "geotrust.com",
    "entrust.net", "secure.globalsign.com", "msocsp.com",
}

# ---- Surge / Loon 专项格式 ----
# Surge: 规则集内嵌策略（TYPE,value,策略[,no-resolve]），策略名与 Clash 分组名保持一致
# Loon:  裸规则列表（TYPE,value），策略在 [Remote Rule] 导入时用 policy= 指定（kelee.one / skk.moe 惯例）
SURGE_POLICIES = {
    "teams": "Teams",
    "office-direct": "DIRECT",
    "steam-direct": "DIRECT",
    "game-cdn-direct": "DIRECT",
    "custom-direct": "DIRECT",
    "custom-fallback": "兜底",
}
# 每个客户端独立目录，便于将来格式分叉（专项专用）
CLASH_DIR = RULES_DIR / "clash"
SURGE_DIR = RULES_DIR / "surge"
LOON_DIR = RULES_DIR / "loon"

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


def _surge_rule(line: str, policy: str) -> str | None:
    """Clash classical 规则行 → Surge 格式（内嵌策略，IP 规则追加 no-resolve）。"""
    s = line.strip()
    if s.startswith("IP-CIDR6,") or s.startswith("IP-CIDR,"):
        return f"{s},{policy},no-resolve"
    if s.startswith("DOMAIN-SUFFIX,") or s.startswith("DOMAIN,"):
        return f"{s},{policy}"
    return None  # 注释/空行等跳过


def _loon_rule(line: str) -> str | None:
    """Clash classical 规则行 → Loon 裸规则（策略在导入时通过 policy= 指定）。"""
    s = line.strip()
    if s.startswith(("IP-CIDR6,", "IP-CIDR,", "DOMAIN-SUFFIX,", "DOMAIN,")):
        return s
    return None  # 注释/空行等跳过


def _write_surge() -> None:
    """生成 Surge 专项规则集（内嵌策略）。"""
    SURGE_DIR.mkdir(parents=True, exist_ok=True)
    for name, policy in SURGE_POLICIES.items():
        src = CLASH_DIR / f"{name}.txt"
        if not src.exists():
            print(f"[surge] 跳过缺失的 {name}.txt")
            continue
        out_lines = [
            "# Surge 规则集 (由 crawler/update_rules.py 生成)",
            f"# 来源: rules/clash/{name}.txt   策略: {policy}",
            "# 用法: [Rule] 段 `Rule Set = <url>`",
            "",
        ]
        for line in src.read_text(encoding="utf-8").splitlines():
            conv = _surge_rule(line, policy)
            if conv:
                out_lines.append(conv)
        dst = SURGE_DIR / f"{name}.txt"
        dst.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
        print(f"[surge] 已写入 {dst.relative_to(REPO_ROOT)} ({len(out_lines) - 4} 条)")


def _write_loon() -> None:
    """生成 Loon 专项规则集（裸规则，policy= 在导入时指定）。"""
    LOON_DIR.mkdir(parents=True, exist_ok=True)
    for name in SURGE_POLICIES:
        src = CLASH_DIR / f"{name}.txt"
        if not src.exists():
            print(f"[loon] 跳过缺失的 {name}.txt")
            continue
        out_lines = [
            "# Loon 规则集 (由 crawler/update_rules.py 生成)",
            f"# 来源: rules/clash/{name}.txt",
            "# 用法: [Remote Rule] `url, policy=<策略组>, tag=..., enabled=true`",
            "",
        ]
        for line in src.read_text(encoding="utf-8").splitlines():
            conv = _loon_rule(line)
            if conv:
                out_lines.append(conv)
        dst = LOON_DIR / f"{name}.lsr"
        dst.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
        print(f"[loon] 已写入 {dst.relative_to(REPO_ROOT)} ({len(out_lines) - 4} 条)")


def update_clients() -> None:
    """Surge 与 Loon 分别生成专项规则集。"""
    _write_surge()
    _write_loon()


def _ipv4_sort_key(ip: str) -> tuple:
    try:
        return tuple(int(p) for p in ip.split("/")[0].split("."))
    except ValueError:
        return (0, 0, 0, 0)


def _write_microsoft_set(name: str, title: str, policy: str, domains, ips_v4, ips_v6) -> None:
    """写单个 Microsoft 规则集（Clash classical 文本）。"""
    lines = [_HEADER.format(ts=_now_utc())]
    lines.append(f"# {title}")
    lines.append(f"# 建议策略: {policy}")
    lines.append(f"# 域名 {len(domains)} 条 / IPv4 {len(ips_v4)} 段 / IPv6 {len(ips_v6)} 段")
    lines.append("")
    lines += [f"DOMAIN-SUFFIX,{d}" for d in sorted(domains)]
    lines += [f"IP-CIDR,{ip}" for ip in sorted(ips_v4, key=_ipv4_sort_key)]
    lines += [f"IP-CIDR6,{ip}" for ip in sorted(ips_v6)]
    out = CLASH_DIR / f"{name}.txt"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[microsoft] 已写入 {out.relative_to(REPO_ROOT)} ({len(lines)} 行)")


def update_microsoft() -> None:
    """Teams 走代理、其余 Office 走直连：从同一份 Microsoft 365 端点清单拆分两个规则集。"""
    print(f"[microsoft] 拉取 {TEAMS_JSON_URL}")
    entries = json.loads(_fetch(TEAMS_JSON_URL))

    per_area_domains: dict[str, set[str]] = {}
    per_area_ips: dict[str, set[str]] = {}
    for e in entries:
        area = e.get("serviceArea", "")
        for u in e.get("urls", []):
            host = _parse_host(u)
            if host and not any(host == d or host.endswith("." + d) for d in CERT_CRL_DOMAINS):
                per_area_domains.setdefault(area, set()).add(host)
        for ip in e.get("ips", []):
            norm = _normalize_ip(ip)
            if norm:
                per_area_ips.setdefault(area, set()).add(norm)

    # Teams：Skype 服务区域的域名 + 媒体 IP，再加手工补充域名
    teams_domains: set[str] = set(TEAMS_EXTRA_DOMAINS)
    teams_ips: set[str] = set()
    for area in TEAMS_AREA_DOMAINS:
        teams_domains |= per_area_domains.get(area, set())
    for area in TEAMS_AREA_IPS:
        teams_ips |= per_area_ips.get(area, set())

    # Office 其余部分：登录 / Exchange / SharePoint → 直连
    office_domains: set[str] = set()
    for area in OFFICE_AREA_DOMAINS:
        office_domains |= per_area_domains.get(area, set())
    # Teams 域名优先级高于 Office 直连（如 teams.cdn.office.net 会被 office.net 后缀吃掉），
    # 这里从直连集合里剔除所有 Teams 域名，避免依赖规则集顺序。
    office_domains -= teams_domains

    _write_microsoft_set(
        "teams",
        f"Microsoft Teams（服务区域: {', '.join(sorted(TEAMS_AREA_DOMAINS))} + 手工补充，含媒体 IP）",
        "Teams（代理组）",
        teams_domains,
        {ip for ip in teams_ips if ":" not in ip},
        {ip for ip in teams_ips if ":" in ip},
    )
    _write_microsoft_set(
        "office-direct",
        f"Microsoft 365 其余组件：登录 / Exchange / SharePoint（服务区域: {', '.join(sorted(OFFICE_AREA_DOMAINS))}）",
        "DIRECT",
        office_domains,
        set(),
        set(),
    )


def update_steam() -> None:
    out = CLASH_DIR / "steam-direct.txt"
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
    CLASH_DIR.mkdir(parents=True, exist_ok=True)

    if not args.skip_teams:
        update_microsoft()
    if not args.skip_steam:
        update_steam()
    update_clients()  # 始终从当前 Clash 规则集同步 Surge/Loon 专项格式
    print("[done] 更新完成")


if __name__ == "__main__":
    main()
