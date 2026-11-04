# Surge RULE-SET 映射（源：Loon `[Remote Rule]`）

把 `default-optimized.lcf` 的 `[Remote Rule]` 段映射成 Surge 6.11 的 `RULE-SET` 源，保持原顺序。
实测环境：Surge 6.11.0（`/Applications/Surge.app`，PID 1034），本机出网走 Surge 增强模式，
所有 curl 均带 `-x http://127.0.0.1:6152`（Surge 内置 HTTP 代理）取证。

**先说三条与任务书不一致的实测结论：**

1. **条目数是 30 条，不是 29 条。** 文件第 152–182 行是 30 条 `enabled=true` 的 URL 行（`awk` 计数），无重复、无注释夹杂。
2. **仓库 `rules/surge/*.txt` 不能直接当 `RULE-SET` 正文。** 它们每行第三列内嵌策略（例：`DOMAIN,www.ijinshan.com,DIRECT`、`DOMAIN-SUFFIX,1cloudfile.com,兜底`）。Surge 官方文档明确：规则集文件"written without the policy component"，带策略列的行属 Invalid line，会被整条跳过。改用同源的 `rules/clash/*.txt`（裸规则）。
3. **`rule.kelee.one` 本机不可达。** 直连与经代理均返回 Cloudflare 403（Cloudflare 对数据中心 IP），镜像仓库 `IamNewHands/loon-rules` 的 `.github/workflows/sync.yml` 里也写明"kelee 的 Cloudflare 对 GitHub 出口 IP 返回 403"。因此 20 条 kelee 条目改用**同名镜像文件**取证与引用，原站 URL 见「风险与差异」R1。

---

## 映射表

| # | Loon tag | 原 policy | Surge 源 URL | 验证证据 | 备注 |
|---|---|---|---|---|---|
| 1 | ASN.China.list | DIRECT | `https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list` | 200 / 130,484 B / 5,076 条 / 首行 `IP-ASN,4134 // 中国电信骨干网` / policy 字段 0 | 全部是 `IP-ASN`；Surge 支持 IP-ASN（见下「IP-ASN 证据」），① 原样可用 |
| 2 | proxy-rule Teams | Teams | `https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/teams.txt` | 200 / 928 B / 22 条 / 首行 `DOMAIN-SUFFIX,adl.windows.com` / 0 policy | 仓库自有；本机 Sukka profile 已在用同一文件（第 132 行），实测可加载 |
| 3 | proxy-rule Office直连 | DIRECT | `.../rules/clash/office-direct.txt` | 200 / 5,246 B / 140 条 / 首行 `DOMAIN-SUFFIX,aadrm.com` / 0 policy | 同上 |
| 4 | proxy-rule Steam直连 | DIRECT | `.../rules/clash/steam-direct.txt` | 200 / 1,287 B / 31 条 / 首行 `DOMAIN,steamcdn-a.akamaihd.net` / 0 policy | 同上 |
| 5 | proxy-rule 游戏CDN直连 | DIRECT | `.../rules/clash/game-cdn-direct.txt` | 200 / 351 B / 5 条 / 首行 `DOMAIN-SUFFIX,dl.delivery.mp.microsoft.com` / 0 policy | 同上 |
| 6 | proxy-rule 自定义直连 | DIRECT | `.../rules/clash/custom-direct.txt` | 200 / 970 B / 16 条 / 首行 `DOMAIN,www.ijinshan.com` / 0 policy | 同上 |
| 7 | proxy-rule 自定义兜底 | 兜底 | `.../rules/clash/custom-fallback.txt` | 200 / 144 B / 2 条 / 首行 `DOMAIN-SUFFIX,1cloudfile.com` / 0 policy | 同上 |
| 8 | Apple Push | Apple Push | `https://raw.githubusercontent.com/ttyyss2233/Tool/main/shadowrocket/rules/apns.list` | 200 / 414 B / 12 条 / 首行 `DOMAIN-SUFFIX,push.apple.com` / 0 policy | 含 `IP-CIDR,...,no-resolve` 与 `IP-CIDR6`，Surge 语法一致 |
| 9 | AppleIntelligence.list | 美国 | `https://raw.githubusercontent.com/ddgksf2013/Filter/refs/heads/master/AppleIntelligence.list` | 200 / 466 B / 11 条 / 首行 `DOMAIN-SUFFIX, gateway.icloud.com` / 0 policy | 纯 DOMAIN-SUFFIX |
| 10 | AI分流 | AI | `https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/rule/AI.list` | 200 / 2,724 B / 66 条 / 首行 `AND, ((DOMAIN-KEYWORD, ...)` / 0 policy | 首行是逻辑规则，见 R3；原配置里的 `github.com/.../raw/` 形式会 301，建议改用本 raw 直链 |
| 11 | Game.lsr | 兜底 | `https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Game.lsr` | 镜像 200 / 20,244 B / 612 条 / 首行 `DOMAIN, login.live.com` / 0 policy | 头注释 `# UpdateTime：2026-10-29`；IP-CIDR 58 条均带 no-resolve |
| 12 | Telegram | 兜底 | `.../loon/Telegram.lsr` | 镜像 200 / 1,231 B / 40 条 / 首行 `DOMAIN, api.imem.app` / 0 policy | 含 `IP-ASN` 5 条 |
| 13 | TikTok | 兜底 | `.../loon/TikTok.lsr` | 镜像 200 / 2,420 B / 80 条 / 首行注释 `# TikTok by 可莉`，首规则 `DOMAIN, engagements.appsflyer.com` / 0 policy | 含 `IP-ASN` 2 条 |
| 14 | Apple ID | DIRECT | `.../loon/AppleID.lsr` | 镜像 200 / 152 B / 4 条 / 首行 `DOMAIN, appleid.apple.com` / 0 policy | — |
| 15 | Apple.lsr | DIRECT | `.../loon/Apple.lsr` | 镜像 200 / 61,030 B / 1,865 条 / 首行 `DOMAIN, edge.apple` / 0 policy | 含 USER-AGENT 23 条，Surge 支持 |
| 16 | App Store | DIRECT | `.../loon/AppStore.lsr` | 镜像 200 / 98 B / 2 条 / 首行 `DOMAIN, apps.apple.com` / 0 policy | — |
| 17 | GitHub.lsr | 兜底 | `.../loon/GitHub.lsr` | 镜像 200 / 1,022 B / 31 条 / 首行 `DOMAIN-SUFFIX, github.blog` / 0 policy | 原 policy 是「兜底」，profile 里另有 `🐙 GitHub` 组，按任务书保留原名 |
| 18 | Netflix | 媒体解锁 | `.../loon/Netflix.lsr` | 镜像 200 / 42,460 B / 1,157 条 / 首行 `DOMAIN, e13252.dscg.akamaiedge.net` / 0 policy | IP-CIDR 1,115 条全部带 no-resolve |
| 19 | Youtube | 媒体解锁 | `.../loon/YouTube.lsr` | 镜像 200 / 5,553 B / 193 条 / 首行 `DOMAIN, yt3.ggpht.com` / 0 policy | — |
| 20 | Disney | 媒体解锁 | `.../loon/Disney.lsr` | 镜像 200 / 5,649 B / 174 条 / 首行 `DOMAIN, cdn.registerdisney.go.com` / 0 policy | — |
| 21 | Twitter | 兜底 | `.../loon/Twitter.lsr` | 镜像 200 / 1,015 B / 33 条 / 首行 `DOMAIN-SUFFIX, twitter.biz` / 0 policy | — |
| 22 | Facebook | 兜底 | `.../loon/Facebook.lsr` | 镜像 200 / 17,838 B / 570 条 / 首行 `DOMAIN-SUFFIX, instagr.am` / 0 policy | — |
| 23 | Instagram | 兜底 | `.../loon/Instagram.lsr` | 镜像 200 / 163 B / 4 条 / 首行 `DOMAIN-SUFFIX, instagr.am` / 0 policy | — |
| 24 | Spotify | 兜底 | `.../loon/Spotify.lsr` | 镜像 200 / 1,061 B / 30 条 / 首行 `DOMAIN, cdn-spotify-experiments.conductrics.com` / 0 policy | — |
| 25 | Google.lsr | 台湾 | `.../loon/Google.lsr` | 镜像 200 / 20,707 B / 711 条 / 首行 `DOMAIN, lens.l.google.com` / 0 policy | — |
| 26 | OneDrive | 兜底 | `.../loon/OneDrive.lsr` | 镜像 200 / 579 B / 17 条 / 首行 `DOMAIN, oneclient.sfx.ms` / 0 policy | — |
| 27 | Global.lsr | 兜底 | `.../loon/Global.lsr` | 镜像 200 / 1,074,332 B / 36,014 条 / 首行 `DOMAIN, practivate.adobe` / 0 policy | 1 MB / 3.6 万条，首次下载较慢；Surge 6.11 无条目上限 |
| 28 | Direct.lsr | DIRECT | `.../loon/Direct.lsr` | 镜像 200 / 6,565 B / 232 条 / 首行 `DOMAIN, ad.12306.cn` / 0 policy | — |
| 29 | LAN | DIRECT | `.../loon/LAN_SPLITTER.lsr` | 镜像 200 / 299 B / 9 条 / 首行 `IP-CIDR, 10.0.0.0/8, no-resolve` / 0 policy | 也可直接内联 9 行；或直接写 `RULE-SET,LAN,DIRECT`（Surge 内置 LAN 集） |
| 30 | CN REGION | DIRECT | `.../loon/REGION_SPLITTER.lsr` | 镜像 200 / 9 B / 1 条 / 首行 `GEOIP, cn` / 0 policy | 整个文件只有 1 行；等价于内联 `GEOIP,CN,DIRECT`（建议内联，见 R9） |

表中 `.../loon/xxx.lsr` 的完整前缀均为 `https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/`；
`.../rules/clash/xxx.txt` 的完整前缀均为 `https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/`。

### 判定依据（逐条 ①②③④⑤ 归类）

| 归类 | 条目 | 依据 |
|---|---|---|
| ① 原 URL 本身是裸规则 | 1、8、9、10 | 取回文件 0 个 policy 字段，全是 `DOMAIN/P DOMAIN-SUFFIX/IP-CIDR/IP-ASN/USER-AGENT/AND` 行 |
| ② 同项目/同作者提供纯规则版本 | 2–7（改用仓库 `rules/clash/*.txt`） | `rules/surge/*.txt` 内嵌策略不可用；`clash/*.txt` 是 `update_rules.py` 的源文件（`SURGE_DIR`/`LOON_DIR` 都由它生成），且本机 Sukka profile 第 132–134 行已在用 |
| ② kelee 的裸规则（镜像） | 11–30 | kelee `.lsr` 本体就是裸规则（`UpdateTime`/`RuleCount` 头注释 + 无策略列）；原站 403，取同名镜像文件 |
| ④ 等价替代 | 无（本次未被迫替换） | bm7 原生 Surge 列表已实测可作换源方向，但**不等价**：`Apple` kelee 1,865 条 vs bm7 `rule/Surge/Apple/Apple.list` 56 条，故不采用，仅列入附录 |

### IP-ASN 证据（任务书"重点确认"项 1）

- Surge 6.11 二进制 `/Applications/Surge.app/Contents/MacOS/Surge` 内规则类型集合含 `IP-ASN`，并有显示格式串 `IP-ASN,%d`；
- Surge 官方手册《IP Rules》原文：「There are four IP-based rule types: IP-CIDR, IP-CIDR6, GEOIP, and IP-ASN.」示例 `IP-ASN,13335,Proxy`；
- 活体用法：本机 `Sukka Ruleset.conf` 第 172 行 `RULE-SET,https://ruleset.skk.moe/List/ip/telegram_asn.conf,...`，该文件实测含 `IP-ASN,62041` 等 6 条，profile 于 2026-11-04 14:46:51 正常加载。

**结论：Surge 支持 IP-ASN，`ASN.China.list` 不需要换成 IP-CIDR。** 若仍要兜底，替代是 `GEOIP,CN`（Surge 内置）或 bm7 的 ChinaIPs（`rule/Surge/ChinaIPs/ChinaIPs_Resolve.list`，体积数百 KB）。

---

## 可直接粘贴的 RULE-SET 有序清单

与 Loon `[Remote Rule]` 第 152–182 行严格同序；policy 用 Loon 原名。

```
RULE-SET,https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/teams.txt,Teams
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/office-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/steam-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/game-cdn-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/custom-direct.txt,DIRECT
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/custom-fallback.txt,兜底
RULE-SET,https://raw.githubusercontent.com/ttyyss2233/Tool/main/shadowrocket/rules/apns.list,"Apple Push"
RULE-SET,https://raw.githubusercontent.com/ddgksf2013/Filter/refs/heads/master/AppleIntelligence.list,美国
RULE-SET,https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/rule/AI.list,AI
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Game.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Telegram.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/TikTok.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/AppleID.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Apple.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/AppStore.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/GitHub.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Netflix.lsr,媒体解锁
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/YouTube.lsr,媒体解锁
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Disney.lsr,媒体解锁
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Twitter.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Facebook.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Instagram.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Spotify.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Google.lsr,台湾
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/OneDrive.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Global.lsr,兜底
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/Direct.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/LAN_SPLITTER.lsr,DIRECT
RULE-SET,https://raw.githubusercontent.com/IamNewHands/loon-rules/main/loon/REGION_SPLITTER.lsr,DIRECT
```

**这 30 行必须整体放在 `[Rule]` 段的最前面**（`FINAL` 之前）。Surge 没有 Loon 那种"远端规则集优先于内联规则"的语义，优先级完全由行序决定；放到下面会被前面的规则吃掉。

### 建议的 policy 名改写（贴之前按下表替换，否则 Surge 会报策略不存在）

本机在跑的 profile 是 `Sukka Ruleset.conf`，实际组名：

| 清单里的名字 | 本机 profile 里对应组 |
|---|---|
| DIRECT | `DIRECT`（内置，可保留） |
| 兜底 | `🚀 节点选择`（或 `🥲 其他节点`） |
| 媒体解锁 | `🎬 媒体解锁` |
| 台湾 | `🇹🇼 台湾` |
| 美国 | `🇺🇸 美国` |
| Teams | `💼 Teams` |
| AI | `🤖 AI` |
| Apple Push | 无同名组，建议 `🎯 直连` |

### 可选增强：给仓库自有 6 条加 `no-resolve`

`rules/clash/*.txt` 里的 `IP-CIDR` 行没带 `no-resolve`（例 `teams.txt` 的 `IP-CIDR,52.112.0.0/14`）。在 Surge 里这会让到达该行的域名请求触发一次本地 DNS 解析。规则集行级参数可以整集兜住，改成：

```
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/teams.txt,Teams,no-resolve
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/office-direct.txt,DIRECT,no-resolve
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/steam-direct.txt,DIRECT,no-resolve
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/game-cdn-direct.txt,DIRECT,no-resolve
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/custom-direct.txt,DIRECT,no-resolve
RULE-SET,https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/custom-fallback.txt,兜底,no-resolve
```

---

## 风险与差异

**R1 kelee 原站全 20 条改走镜像，镜像已停更 3 天。**
`rule.kelee.one` 与 `kelee.one/Tool/Loon/Lsr/` 本机直连、经 Surge 代理均返回 **HTTP 403 + Cloudflare 拦截页**（5,658 B `Attention Required!`），无法取原站字节；镜像仓库 `IamNewHands/loon-rules` 按 `sync.yml` 从 kelee 拉取后 1:1 落盘（同名 20 个文件全部存在），但其最新提交是 **2026-11-01T02:07:53Z**，文件头 `UpdateTime` 为 **2026-10-29**，且 `sync.yml` 里作者自述 GitHub Actions 出口 IP 也被 kelee 403、`loon/` 目录只能"保持上次内容不变"。
影响：这 20 条用的是 10-29 版规则，不会自动跟新。
后续建议（本次未做，因为只能写这一个文件）：把 kelee 的 20 个 `.lsr` 抄进 `proxy-rule` 仓库自托管，彻底摆脱 403 与镜像停更。

**R2 `ASN.China.list` 每行带尾随 `//` 注释。**
5,270 行里 5,266 行含 `//`，形如 `IP-ASN,4134 // 中国电信骨干网`。Surge 文档只写了"# // ; 开头的行是注释"，未明确尾随注释；但本机 profile 里既有 `RULE-SET,...,"update-interval=86400" // 规则修正`（第 160 行）又有 `GEOIP,CN,"🎯 直连" // China IP`（第 202 行）且正常加载，同一套行解析器**大概率**会剥掉尾随注释。
风险：若某版 Surge 不剥，5,076 条会全部变成 Invalid line 被静默跳过（Surge 的行为是"跳过该行并告警"，不会让整个 profile 失败）——表现是"规则集加载成功但 0 条匹配"。自检办法见文末第 2 步。

**R3 `AI.list` 里有 2 条 `AND` 复合规则。**
首行 `AND, ((DOMAIN-KEYWORD, chatgpt-async-webps-prod-), (DOMAIN-SUFFIX, webpubsub.azure.com))`。Surge 支持 `AND/OR/NOT`，但它和规则集文件的组合未在官方文档里明说；另外该写法在逗号后带空格。最坏情况是这 2 条被跳过（其余 64 条正常），影响面小，不阻断迁移。

**R4 `rules/surge/*.txt` 不可直接引用（已替换）。**
带策略列 → 按 Surge 文档全行 Invalid。改用 `rules/clash/*.txt`。两者内容同源（`update_rules.py` 的 `_write_surge` 与 `_write_loon` 都从 `rules/clash/` 生成），差别只在策略列与 `no-resolve`（见上方"可选增强"）。

**R5 policy 名不对齐会导致整条规则失效。**
清单按任务书用 Loon 原名（`兜底`/`媒体解锁`/`台湾`/`美国`/`Apple Push`），而本机 profile 的组名带 emoji 前缀。贴进 profile 前必须按上面那张表替换，否则 Surge 会报策略不存在。

**R6 顺序语义差异。**
Loon：远端规则集整体优先于内联 `[Rule]`。Surge：纯行序。必须整段置于 `[Rule]` 顶部，顺序与本清单一致，否则 #1（ASN.China，中国 IP 直连）会被后面的代理规则压住。

**R7 逗号后空格。**
kelee 系文件是 `DOMAIN, apps.apple.com`、`IP-CIDR, 10.0.0.0/8, no-resolve` 这种带空格的写法（Loon 容忍）。Surge 一般会 trim，但未实测；`LAN_SPLITTER` 9 条全带空格，属于同一风险面。自检同 R2。

**R8 `Global.lsr` 体积 1,074,332 B / 36,014 条。**
首次下载与建索引会慢一拍；Surge 文档：超过 1,000 条域名规则会落到磁盘索引，超过 50 条 IP-CIDR 会编译成二进制 IP 库，匹配性能不受影响。默认 `update-interval=86400`。

**R9 `REGION_SPLITTER.lsr` 只有 1 行 `GEOIP, cn`。**
为一条规则维护一个远端文件不划算，建议直接内联替换为 `GEOIP,CN,DIRECT`（`GEOIP` 在规则集内也是合法类型，两种都行）。`LAN_SPLITTER` 同理，或直接用 Surge 内置 `RULE-SET,LAN,DIRECT`，但注意内置 LAN 集的内容随版本变化，不如自带 9 条可控。

**R10 条目数 30 ≠ 任务书的 29。** 以文件实测为准，全部映射。另：仓库里有一个未提交进配置的 `rules/loon/priority-direct.lsr`（iCloud/语音输入直连，2026-11-03 提交，commit `57622e3` 声称"置于 [Remote Rule] 最前"），但当前 `default-optimized.lcf` 的 `[Remote Rule]` 里**没有**这一条（`grep priority-direct` 无命中，配置 mtime 2026-11-04 08:16）。本清单不含它；如果它该在，需补在第 1 条之前。

---

## 上线自检（三步）

1. 看有没有整集加载失败：Surge 日志筛 `Ruleset` / `failed to load` / `Invalid`。
2. 看有没有"加载了但 0 条有效"：日志里应出现 `Sub-rule matched: <规则> (in <规则集名>)`；对照 `ASN.China`（应有命中的 IP-ASN 行）与任一 kelee 集各打一次。
3. 抽查顺序：访问一个中国 IP 站点，应命中 `ASN.China` 的 IP-ASN → DIRECT，而不是后面的兜底组。

> 取证命令（本次全部经 Surge 内置代理）：`curl -x http://127.0.0.1:6152 -sSL -o <file> -w '%{http_code} %{size_download}' <url>`。
> Surge 版本：`/Applications/Surge.app/Contents/Info.plist` → 6.11.0。

---

## 附录：如需换源（bm7 原生 Surge 列表，实测可下载但不与 kelee 等价）

`https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/<Name>/<Name>.list`

| Name | 状态 | 字节 | 条数 | kelee 同条目的条数 |
|---|---|---|---|---|
| Game | 200 | 19,725 | 612 | 612 |
| Telegram | 200 | 1,680 | 46 | 40 |
| TikTok | 200 | 1,242 | 36 | 80 |
| AppleID | 200 | 247 | 4 | 4 |
| Apple | 200 | 1,805 | 56 | **1,865** |
| AppStore | 200 | 196 | 2 | 2 |
| GitHub | 200 | 1,117 | 31 | 31 |
| Netflix | 200 | 40,424 | 1,158 | 1,157 |
| YouTube | 200 | 5,451 | 190 | 193 |
| Disney | 200 | 5,674 | 175 | 174 |
| Twitter | 200 | 1,116 | 33 | 33 |
| Facebook | 200 | 17,399 | 570 | 570 |
| Instagram | 200 | 287 | 4 | 4 |
| Spotify | 200 | 1,246 | 31 | 30 |
| Google | 200 | 19,985 | 703 | 711 |
| OneDrive | 200 | 735 | 18 | 17 |
| Global | 200 | 6,267 | 202 | **36,014** |
| Direct | 200 | 7,385 | 268 | 232 |

**为什么不当主源**：kelee 的 `.lsr` 是 blackmatrix7 多条列表合并版（`luestr/ShuntRules` README 自述数据源为 `blackmatrix7/ios_rule_script`，并把 `Apple.list`+`Apple_Domain.list`+`Apple_Resolve.list` 合并成一份）。`Apple`（1,865 vs 56）和 `Global`（36,014 vs 202）差两个数量级，说明 bm7 的 `Surge/<Name>.list` 并不是那个合并结果，直接替换会明显缩水。仅作 kelee 镜像彻底失效时的应急备选。
