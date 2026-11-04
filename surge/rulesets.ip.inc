# Surge IP 规则集（必须排在全部域名规则之后，原因见 rulesets.domain.inc 顶部说明）
# 中国 IP 直连：放最后仍然生效——不在任何域名列表里的域名解析出 CN IP 后照样命中
RULE-SET,https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list,DIRECT
# 局域网用 Surge 内置集（Loon 的 LAN_SPLITTER 只有 9 条私有段，内容等价）
RULE-SET,LAN,DIRECT,no-resolve
# Loon 的 REGION_SPLITTER.lsr 只有一行 GEOIP,cn，直接内联
GEOIP,CN,DIRECT
