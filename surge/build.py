#!/usr/bin/env python3
"""从 Loon 配置生成 Surge profile。

用法:
    python3 surge/build.py            # 生成到 Surge Profiles 目录并校验
    python3 surge/build.py --dry-run  # 只渲染到 surge/out/，不碰 Surge

单一数据源: Loon 配置里的 [Remote Proxy]（订阅地址）、[Remote Filter]（地区正则）、
[Mitm]（CA 证书）。节点、正则、CA 都不在仓库里重复维护。
"""
from __future__ import annotations

import argparse
import re
import secrets
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TEMPLATE = REPO / "surge" / "profile.template.conf"
RULESETS_DOMAIN_INC = REPO / "surge" / "rulesets.domain.inc"
RULESETS_IP_INC = REPO / "surge" / "rulesets.ip.inc"
KEY_FILE = REPO / "surge" / ".http-api-key"

LOON_CFG = Path.home() / (
    "Library/Mobile Documents/iCloud~com~ruikq~decar/Documents/Configs/default-optimized.lcf"
)
SURGE_PROFILES = Path.home() / "Library/Application Support/Surge/Profiles"
OUT_NAME = "Surge_Optimized.conf"

# Loon 过滤器名 -> 模板占位符
FILTER_MAP = {
    "香港节点": "RE_HK",
    "台湾节点": "RE_TW",
    "日本节点": "RE_JP",
    "韩国节点": "RE_KR",
    "新国节点": "RE_SG",
    "美国节点": "RE_US",
    "高倍节点池": "RE_HIGH",
    "低倍节点池": "RE_LOW",
    "媒体节点": "RE_MEDIA",
    "上海电信转香港节点": "RE_SH2HK",
    "全球节点": "RE_ALL",
}


def parse_loon(path: Path) -> dict[str, str]:
    """抓取订阅地址、地区正则、MITM CA。"""
    text = path.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    section = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("[") and line.endswith("]"):
            section = line[1:-1]
            continue
        if section == "Remote Proxy":
            # 形如: 原始 = https://...,parser-enabled = true,...
            name, _, value = line.partition("=")
            url = value.strip().split(",")[0].strip()
            if url.startswith("http") and "SUB_URL" not in out:
                out["SUB_URL"] = url
        elif section == "Remote Filter":
            m = re.match(r"^(\S+)\s*=\s*NameRegex,\s*FilterKey\s*=\s*\"(.*)\"\s*$", line)
            if m and m.group(1) in FILTER_MAP:
                out[FILTER_MAP[m.group(1)]] = m.group(2)
    # MITM CA
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("ca-p12"):
            out["CA_P12"] = line.split("=", 1)[1].strip()
        elif line.startswith("ca-passphrase"):
            out["CA_PASS"] = line.split("=", 1)[1].strip()
    return out


def provider_url(sub_url: str) -> str:
    """Surge 需要 name = type, ... 的节点列表格式，订阅端用 &list=surge 直接给。"""
    sep = "&" if "?" in sub_url else "?"
    if "list=surge" in sub_url:
        return sub_url
    return f"{sub_url}{sep}list=surge"


def http_api_key() -> str:
    if KEY_FILE.exists():
        return KEY_FILE.read_text(encoding="utf-8").strip()
    key = secrets.token_urlsafe(12)
    KEY_FILE.write_text(key + "\n", encoding="utf-8")
    KEY_FILE.chmod(0o600)
    return key


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not LOON_CFG.exists():
        print(f"找不到 Loon 配置: {LOON_CFG}", file=sys.stderr)
        return 1
    data = parse_loon(LOON_CFG)
    missing = [k for k in ("SUB_URL", "CA_P12", "CA_PASS", *FILTER_MAP.values()) if k not in data]
    if missing:
        print(f"Loon 配置里缺少: {', '.join(missing)}", file=sys.stderr)
        return 1

    rendered = TEMPLATE.read_text(encoding="utf-8")
    rendered = rendered.replace("{{SUB_URL}}", provider_url(data["SUB_URL"]))
    rendered = rendered.replace("{{CA_P12}}", data["CA_P12"])
    rendered = rendered.replace("{{CA_PASS}}", data["CA_PASS"])
    rendered = rendered.replace("{{HTTP_API_KEY}}", http_api_key())
    rendered = rendered.replace("{{SCRIPTS_BASE}}", str(REPO / "tools" / "surge"))
    for placeholder in FILTER_MAP.values():
        rendered = rendered.replace("{{%s}}" % placeholder, data[placeholder])
    rendered = rendered.replace(
        "{{RULESETS_DOMAIN}}", RULESETS_DOMAIN_INC.read_text(encoding="utf-8").strip()
    )
    rendered = rendered.replace(
        "{{RULESETS_IP}}", RULESETS_IP_INC.read_text(encoding="utf-8").strip()
    )

    if "{{" in rendered:
        leftover = sorted(set(re.findall(r"\{\{(\w+)\}\}", rendered)))
        print(f"还有未替换的占位符: {leftover}", file=sys.stderr)
        return 1

    out_dir = REPO / "surge" / "out" if args.dry_run else SURGE_PROFILES
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / OUT_NAME
    out.write_text(rendered, encoding="utf-8")
    print(f"已写入 {out}  ({len(rendered)} 字节)")

    cli = "/opt/homebrew/bin/surge-cli"
    if Path(cli).exists():
        res = subprocess.run([cli, "-c", str(out)], capture_output=True, text=True)
        print("校验:", (res.stdout + res.stderr).strip() or f"exit={res.returncode}")
        if res.returncode != 0:
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
