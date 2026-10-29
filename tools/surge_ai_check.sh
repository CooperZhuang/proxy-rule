#!/usr/bin/env bash
# 用 Surge CLI 逐个策略探测 AI 站点可达性，确认哪个地区组/策略真的能访问 AI。
#
# 用法：
#   SURGE_CLI_PASSWORD=<控制器密码> ./tools/surge_ai_check.sh
#   SURGE_CLI_PASSWORD=... ./tools/surge_ai_check.sh "🇺🇸 美国节点" "🇯🇵 日本节点"
#   TARGET_HOST=192.168.31.225:6166 SURGE_CLI_PASSWORD=... ./tools/surge_ai_check.sh
#
# 说明：
#   - Surge 6 起组级 url= 测速参数已失效；AI 分流靠 smart 组的 per-site 记忆，
#     本脚本用于人工核对"某地区组此刻能不能访问 AI"。
#   - 控制器密码即 profile 里 external-controller-access 的密码。
#   - 403 多为 Cloudflare 对 HEAD/无 UA 的拦截，不代表线路不通；以 200/204 为准。

set -u

CLI="${SURGE_CLI:-/Applications/Surge.app/Contents/Applications/surge-cli}"
TARGET_HOST="${TARGET_HOST:-127.0.0.1:6166}"
URLS="${AI_URLS:-https://chatgpt.com/robots.txt https://gemini.google.com/robots.txt https://copilot.microsoft.com/robots.txt}"

if [ -z "${SURGE_CLI_PASSWORD:-}" ]; then
  echo "缺少 SURGE_CLI_PASSWORD（profile 里 external-controller-access 的密码）" >&2
  exit 1
fi

if [ "$#" -gt 0 ]; then
  POLICIES=("$@")
else
  POLICIES=("🇺🇸 美国节点" "🇯🇵 日本节点" "🇸🇬 新加坡节点" "🇨🇳 台湾节点" "🇭🇰 香港节点" "AI")
fi

probe() {
  "$CLI" -r "$TARGET_HOST" http probe "$1" "$2" 2>/dev/null |
    awk '/^Status:/{s=$2} /^Duration:/{d=$2} END{ if (s) printf "%s %sms", s, d; else printf "FAIL" }'
}

for p in "${POLICIES[@]}"; do
  for u in $URLS; do
    printf "%-16s | %-38s | %s\n" "$p" "$u" "$(probe "$u" "$p")"
  done
done
