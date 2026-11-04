# Surge 域名规则集（顺序即优先级）
# 迁移自 Loon [Remote Rule]，映射依据见 surge/rulesets.md
#
# 【为什么 Google 排第一】本机对 www.google.com 等域名的 DNS 解析结果被污染成
# Facebook/Twitter 的 IP（实测 69.171.235.22 / 31.13.92.37 / 104.244.42.197）。
# Surge 求值到 IP 类规则时会先做 DNS 解析，污染的 IP 会被 Facebook.lsr 的 IP-ASN,32934
# 命中。因此：① 所有域名规则必须排在 IP 规则之前；② Google 这类最常被污染的域名集合
# 要排在其它品牌集合之前。

# --- Google（必须最前，见上方说明）---
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Google.lsr,台湾

# --- proxy-rule 自有规则（用 rules/clash/*.txt：rules/surge/*.txt 带策略列，Surge 判整行无效）---
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/teams.txt,Teams
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/office-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/steam-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/game-cdn-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/custom-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/custom-fallback.txt,兜底

# --- Apple / AI ---
RULE-SET,https://raw.githubusercontent.com/ttyyss2233/Tool/main/shadowrocket/rules/apns.list,Apple Push
RULE-SET,https://raw.githubusercontent.com/ddgksf2013/Filter/refs/heads/master/AppleIntelligence.list,美国
RULE-SET,https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/rule/AI.list,AI

# --- kelee 系规则集：rule.kelee.one 对本机直连/代理均返回 403（Cloudflare），
#     改用 1:1 镜像 IamNewHands/loon-rules（与 kelee 同源，落后 3–5 天）---
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/AppleID.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/AppStore.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/GitHub.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Apple.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/YouTube.lsr,媒体解锁
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Disney.lsr,媒体解锁
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Netflix.lsr,媒体解锁
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/TikTok.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Telegram.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Spotify.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Twitter.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Instagram.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Facebook.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/OneDrive.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Game.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Direct.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Global.lsr,兜底
