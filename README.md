# proxy-rule

个人 Clash / mihomo 分流规则仓库。规则文件由 Python 爬虫（`crawler/update_rules.py`）自动更新，
并通过 GitHub Actions 每日自动运行，Clash 侧通过 `rule-providers` 定时拉取。

## 目录结构

```
proxy-rule/
├── rules/                        # 分流规则集（按客户端分专项目录）
│   ├── clash/                    # Clash / mihomo（*.txt）
│   │   ├── teams.txt             #   Microsoft Teams 域名 + 媒体 IP → Teams 代理组（自动生成）
│   │   ├── office-direct.txt     #   Microsoft 365 其余组件（登录/Exchange/SharePoint）→ 直连（自动生成）
│   │   ├── steam-direct.txt      #   Steam 直连（基础手工维护 + 上游自动合并）
│   │   ├── game-cdn-direct.txt   #   游戏平台下载 CDN 直连（手工维护）
│   │   ├── custom-direct.txt     #   手写自定义直连规则（手工维护）
│   │   └── custom-fallback.txt   #   手写自定义规则 → 兜底（手工维护）
│   ├── surge/                    # Surge 专项规则集（*.txt，爬虫自动生成）
│   └── loon/                     # Loon 专项规则集（*.lsr，爬虫自动生成）
├── clash/
│   └── config.yaml               # 完整 mihomo 配置备份（无节点/订阅地址，本机原样使用）
├── crawler/
│   ├── update_rules.py           # 规则更新爬虫
│   └── requirements.txt
└── .github/workflows/update-rules.yml  # 每日自动更新 + 自动提交
```

## 规则说明

表内路径均为 `rules/clash/` 下；`rules/surge/`（*.txt，内嵌策略）、`rules/loon/`（*.lsr，裸规则）为对应客户端专项副本。

| 文件 | 内容 | Clash 目标 |
|---|---|---|
| `teams.txt` | Microsoft 365 官方端点 JSON 提取：Skype 服务区域（Teams 域名 + 媒体 IP）+ 手工补充的 Teams 客户端域名 | `Teams` |
| `office-direct.txt` | Microsoft 365 其余组件：Common / Exchange / SharePoint 服务区域（登录、Outlook、SharePoint/OneDrive 等） | `DIRECT` |
| `steam-direct.txt` | Steam 商店/CDN/社区国内直连域名（基础列表 + Femoon/clash-rules 上游合并） | `DIRECT` |
| `game-cdn-direct.txt` | 微软 / Xbox / Ubisoft / Epic 国内下载 CDN | `DIRECT` |
| `custom-direct.txt` | 手写直连规则（金山西山居、time.is 等） | `DIRECT` |
| `custom-fallback.txt` | 手写规则（网盘类） | `兜底` |

所有规则集在 `rules/surge/` 与 `rules/loon/` 下都有对应客户端的专项副本，由爬虫自动同步；
两个目录相互独立，便于将来 Surge / Loon 格式各自演化（专项专用）。

`teams.txt` / `office-direct.txt` 的数据源同为微软官方发布的 365 端点清单：
<https://learn.microsoft.com/office365/enterprise/urls-and-ip-address-ranges>

- Teams 只取 **Skype 服务区域**（该区域承载 `teams.microsoft.com` / `teams.cloud.microsoft` 与 Teams 媒体 IP），
  再手工补上清单缺失的 `teams.live.com`（个人版）、`microsoftteams.com`、`teams.cdn.office.net`、
  `statics.teams.cdn.office.net`、`teams.events.data.microsoft.com`
- 其余 Office 组件（Common / Exchange / SharePoint）走直连，并自动剔除与 Teams 重叠的域名
  （如 `teams.cdn.office.net` 会被 `office.net` 后缀吃掉，先在 `teams` 集合里保留、再从直连集合里去掉）
- 生成时会剔除证书链校验（CRL/OCSP）端点（digicert/globalsign/verisign 等）及含通配符的条目
  （如 `autodiscover.*.onmicrosoft.com`，由已有的 `onmicrosoft.com` 覆盖）

## 组名约定

Clash / Surge / Loon 三端统一精简组名（无 emoji 前缀）：

| 类型 | 组名 |
|---|---|
| 地区自动优选（url-test） | `香港` `台湾` `日本` `韩国` `新国` `美国` `游戏` `全球` |
| Loon 手动选择（select） | `香港手动` `台湾手动` `日本手动` `韩国手动` `新国手动` `美国手动` `游戏手动` `全球手动` |
| 兜底（FINAL / fallback） | `兜底` |
| Clash 功能组 | `手动` `加速` `苹果` `AI` `Teams` `网易云` `电报` `拦截` `自动` |
| Teams 代理组（三端同功能） | Clash `Teams`（select）/ Loon `Teams`（select）/ Surge 规则集内嵌 `Teams` |
| 内置策略 | `DIRECT` `REJECT-DROP` `REJECT`（Loon 另有 `Apple Push`） |

- 规则集引用的组：`teams` → `Teams`；`office-direct` → `DIRECT`；`custom-fallback` → `兜底`；其余直连规则 → `DIRECT`
- `Teams` 组建议成员：`香港` `日本` `新国`（Teams 个人版在这三地都可用，按延迟选）
- Surge 内嵌策略名在 `SURGE_POLICIES` 维护；Loon 策略在 `[Remote Rule]` 导入时指定

## 在 Surge / Loon 中使用

**Surge**：`rules/surge/` 规则集内嵌策略（与 Clash 分组名一致：`美国` / `DIRECT` / `兜底`），
IP 规则已追加 `no-resolve`。策略名在 `crawler/update_rules.py` 的 `SURGE_POLICIES` 中修改。

```
[Rule]
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/teams.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/office-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/steam-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/game-cdn-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/custom-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/custom-fallback.txt
```

**Loon**：`rules/loon/` 为裸规则列表（不含策略），策略在 `[Remote Rule]` 导入时用 `policy=` 指定
（与 kelee.one / skk.moe 规则集惯例一致），可自由路由到任意策略组：

```
[Remote Rule]
https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/loon/teams.lsr, policy=Teams, tag=proxy-rule Teams, enabled=true
https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/loon/office-direct.lsr, policy=DIRECT, tag=proxy-rule Office直连, enabled=true
https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/loon/steam-direct.lsr, policy=DIRECT, tag=proxy-rule Steam直连, enabled=true
https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/loon/game-cdn-direct.lsr, policy=DIRECT, tag=proxy-rule 游戏CDN直连, enabled=true
https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/loon/custom-direct.lsr, policy=DIRECT, tag=proxy-rule 自定义直连, enabled=true
https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/loon/custom-fallback.lsr, policy=兜底, tag=proxy-rule 自定义兜底, enabled=true
```

raw.githubusercontent 备用链接：`https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/surge/<file>`（Loon 同理换成 `rules/loon/*.lsr`）。
Loon 建议直接用 raw 链接（与 kelee.one / skk.moe 等规则源一致）；jsdelivr `@main` 有边缘缓存延迟，内容更新后可能数小时才刷新。

## 在 Clash / mihomo 中使用

在 `rule-providers` 中添加（示例以 jsdelivr CDN 为主，国内可达；也可换用 raw 链接）：

```yaml
rule-providers:
  teams:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/clash/teams.txt
    path: ./ruleset/teams.txt
  office_direct:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/clash/office-direct.txt
    path: ./ruleset/office_direct.txt
  steam_direct:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/clash/steam-direct.txt
    path: ./ruleset/steam_direct.txt
  game_cdn_direct:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/clash/game-cdn-direct.txt
    path: ./ruleset/game_cdn_direct.txt
  custom_direct:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/clash/custom-direct.txt
    path: ./ruleset/custom_direct.txt
  custom_fallback:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/clash/custom-fallback.txt
    path: ./ruleset/custom_fallback.txt
```

`rules` 中引用（注意放在 skk.moe 等通用规则之前，保持原优先级）：

```yaml
rules:
  - RULE-SET,teams,Teams
  - RULE-SET,office_direct,DIRECT
  - RULE-SET,custom_direct,DIRECT
  - RULE-SET,custom_fallback,兜底
  - RULE-SET,steam_direct,DIRECT
  - RULE-SET,game_cdn_direct,DIRECT
```

raw.githubusercontent 备用链接：`https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/clash/<file>`

## 配置备份

`clash/config.yaml` 为本机 mihomo 配置的公开备份（去除了节点订阅部分，不含订阅 URL）。
本机仍以 Clash Verge 本地配置方式使用（节点由本地 `proxy-providers` 从机场订阅拉取），
该文件仅作备份/参考；如需独立运行，自行在 `proxy-providers` 填入订阅即可。

## 本地更新规则

```bash
pip install -r crawler/requirements.txt
python crawler/update_rules.py
```

参数：

- `--skip-teams`：跳过微软 365 端点提取
- `--skip-steam`：跳过 steam 上游合并

## 自动更新

`.github/workflows/update-rules.yml` 每天 04:00 UTC 运行爬虫，若有变更自动提交回仓库。
Clash 侧 `interval: 43200`（12 小时）自动拉取最新规则。

## 自定义维护

- 需要调整 Teams / Office 覆盖范围：修改 `crawler/update_rules.py` 中的
  `TEAMS_AREA_DOMAINS` / `TEAMS_AREA_IPS` / `TEAMS_EXTRA_DOMAINS` / `OFFICE_AREA_DOMAINS` / `CERT_CRL_DOMAINS` 后重新运行爬虫。
- 手工规则直接编辑 `rules/clash/*.txt`（`teams.txt` / `office-direct.txt` 除外，会被爬虫覆盖）；
  修改后运行一次爬虫即可同步 `rules/surge/*.txt` 与 `rules/loon/*.lsr` 专项格式。
- Surge 内嵌策略名：编辑 `crawler/update_rules.py` 的 `SURGE_POLICIES`。
- Loon 策略在配置导入时指定（裸规则），与规则文件解耦。
- Surge 与 Loon 格式各自独立：`crawler/update_rules.py` 的 `_write_surge` / `_write_loon`
  分别生成，互不影响（`SURGE_DIR` / `LOON_DIR`）。

## Surge 侧的 AI 分流与解锁体检

Surge 6 起组级 `url=` 测速参数已失效（官方文档明确 legacy 参数无效），所以"组级探针"这条路走不通。
可行做法是**脚本 + cron**：Surge 脚本 API 支持按指定策略发请求，也能切换 select 组。

### 1. AI 组（select，节点级）

```
🤖 AI = select, include-all-proxies=1, policy-regex-filter=^(?!.*Premium)(?!.*(港|HK|hk|HongKong|Hong Kong)).*(美|US|United States|日本|JP|Japan|NTT|东京|大阪|新加坡|SG|Singapore|坡|狮城|台|TW|Taiwan).*$
```

必须是 `select` 组：`$surge.setSelectGroupPolicy` 只能改手动选择组，且成员必须是节点（不能嵌套别的组，
否则脚本 pin 不到）。这么写会展开成约 73 个美/日/新/台节点，脚本逐个做内容级检测后 pin 一个。

### 2. cron 脚本 `tools/surge_ai_unlock_check.js`

判定**不看状态码 200**（Google 会把「异常流量」拦截页也返回 200/429）：

| 服务 | 通过条件 |
|---|---|
| OpenAI | `GET api.openai.com/v1/models` → 401 且 body 含 `invalid_request_error` / `Missing bearer` / `API key` |
| Gemini | `GET gemini.google.com/app` → 200 且 body > 20 KB，且不含 `unusual traffic` / `异常流量`（429 或短页 = 被风控） |

流程：

1. **稳定优先**：先验证当前选中的节点，通过就保持不动（失败重试一次），避免出口 IP 变化触发风控
2. 失败才扫描候选：每批 6 个并发跑 OpenAI 检测，收集最快的一批；再对前 5 名逐个确认 Gemini
3. 通过则 `$surge.setSelectGroupPolicy("🤖 AI", 节点)`，写 `$surge.logbook`、系统通知
4. 结果持久化到 `SGJSVMPersistentStore/ai_verify_last`

profile `[Script]` 声明（每 30 分钟一次）：

```
[Script]
ai-unlock-check = type=cron,cronexp="*/30 * * * *",script-path=/Users/<you>/.surge/scripts/ai-unlock-check.js,timeout=120
```

改完脚本源码要 `surge-cli restart-engine`（只 reload 配置不会重读脚本源码）。

Surge 的脚本 API 只能改「选中项」，没有增删组成员的能力。如果要求「组里只包含验证通过的节点」，
需要外部任务生成 `policy-path` 文件再 reload（见 tools/surge_ai_unlock_check.js 文件头注释）。

### 规则优先级（踩过的坑）

AI 域名必须在 profile 里**显式写在前面的 DOMAIN-SUFFIX 规则**，否则会被通用列表先命中：

- `gemini.google.com` / `aistudio.google.com` 会被 blackmatrix7 的 `Google.list`（→ 台湾节点）抢走
- `copilot.microsoft.com` 会被 office-direct（含 `microsoft.com` 后缀）抢成 DIRECT
- 因此 `[Rule]` 顶部（Teams 进程规则之后）先放这几条，再放各 RULE-SET；`ai.conf` 也提到 `Google.list` 之前

### 3. 手动核对（不依赖脚本）

```bash
SURGE_CLI_PASSWORD=<控制器密码> tools/surge_ai_check.sh
# 指定策略
SURGE_CLI_PASSWORD=... tools/surge_ai_check.sh "🇺🇸 美国节点" "🇯🇵 日本节点"
```

用 `surge-cli http probe <url> <policy>` 逐个策略测 `chatgpt.com` / `gemini.google.com` /
`copilot.microsoft.com`，以 200/204 为准（403 多为 Cloudflare 对 HEAD 的拦截，不代表线路不通）。

### GitHub 下载提速（踩过的坑）

github.com 网页走代理没问题，但 release 资产下载**实际落在 release-assets.githubusercontent.com**，
它会被 cdn.conf 规则命中 → 🚀 节点选择，而香港组 smart 选中的便宜节点到 GitHub CDN 只有
0.17–0.33 MB/s，看起来就是「下载很慢」。

处理方式：建一个 🐙 GitHub 自动测速组，只收「上海电信转香港 HKC/HKT/BGP」这 8 个 1.0x 节点
（实测单连接 5–13 MB/s），然后把下载相关域名全部指过去：

```
🐙 GitHub = url-test, include-all-proxies=1, policy-regex-filter=^上海电信转香港(HKC|HKT|BGP).*$, interval = 600, tolerance = 100

DOMAIN-SUFFIX,codeload.github.com,🐙 GitHub
DOMAIN-SUFFIX,objects.githubusercontent.com,🐙 GitHub
DOMAIN-SUFFIX,release-assets.githubusercontent.com,🐙 GitHub
DOMAIN-SUFFIX,raw.githubusercontent.com,🐙 GitHub
DOMAIN,api.github.com,🐙 GitHub
```

实测（release zip 10.8MB）：节点选择 0.33 MB/s → 🐙 GitHub 8.2–9.7 MB/s；tarball 15.4 MB/s。
GitHub 单连接本身也限速，大文件用多线程下载器（aria2c -x8 -s8）还能叠加。

### 跨设备一致性（macOS Surge / macOS Clash / Windows Clash Verge）

同名分组与规则在三端保持一致，差异只在平台适配：

| 项 | macOS Surge | macOS Clash（mihomo-party） | Windows Clash Verge |
|---|---|---|---|
| Teams 进程 | PROCESS-NAME 路径 | PROCESS-NAME,MSTeams | PROCESS-NAME,ms-teams.exe / Teams.exe |
| 端口规则 | AND((PROTOCOL,TCP),(DEST-PORT,22)) | DST-PORT,22 | DST-PORT,22 |
| GitHub 组 | 🐙 GitHub（上海电信转香港） | 🐙 GitHub（同上） | 🐙 GitHub（同上） |
| 媒体组 | 🎬 媒体解锁（[M]+倍率1.0） | 同 | 同 |

Windows 侧 Clash Verge 的两个文件都要改，否则下次 Verge 重新生成会覆盖：

```
%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\profiles\<当前profile>.yaml      # 源，持久
C:\ProgramData\clash-verge-service\users\<hash>\runtime\config.yaml              # 核心实际加载
```

改完用核心 API 热重载（secret 见 runtime config 的 `secret`）：

```powershell
$h = @{ Authorization = 'Bearer <secret>' }
$body = @{ path = 'C:\ProgramData\clash-verge-service\users\<hash>\runtime\config.yaml' } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Put -Uri 'http://127.0.0.1:9097/configs?force=true' -Headers $h -Body $body -ContentType 'application/json'
```

Loon 侧没有节点级过滤 API，但它的节点名同样带 `[倍率:x]` / `[M]`，所以用 `[Remote Filter]` 的
`NameRegex` 过滤器 + `url-test` 组实现了同名分组：

```
高倍节点 = NameRegex, FilterKey = "^(?=.*倍率:(?:1\.[5-9]|[2-9](?:\.[0-9])?\]))(?!.*Premium).*$"
媒体节点 = NameRegex, FilterKey = "^(?=.*\[M\])(?=.*倍率:1\])(?!.*Premium).*$"
上海电信转香港节点 = NameRegex, FilterKey = "^(?=.*上海电信转香港).*$"
```

### Clash Verge 全局扩展层（Windows PC）

`clash/verge/` 下是两个可直接放进 Verge 的全局扩展文件，作用是对**所有** profile 统一改造，
不依赖具体订阅模板，换机场也不用重配：

| 文件 | 作用 |
|---|---|
| `Merge.yaml` | 静态设置：tcp-concurrent、unified-delay、find-process-mode、chrome 指纹、DNS、store-selected |
| `Script.js` | 动态改造：组名 emoji 归一、补齐 🤖 AI/🎬 媒体解锁/⚡ 高倍/🪫 低倍/🐙 GitHub/💼 Teams、规则置顶与去重、DST-PORT 插到 MATCH 前、测试地址 https 化 |

安装位置（Verge 2.5.x）：

```
%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\profiles\Merge.yaml
%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\profiles\Script.js
```

改完要让 Verge 重新生成运行时配置（在 UI 里点一次当前 profile，或重启 Verge）；只改文件不会立即生效。
想立即验证脚本逻辑，可以脱离 YAML 直接跑：

```powershell
node -e "const fs=require('fs'); const s=fs.readFileSync('Script.js','utf8'); const m=new Function(s+';return main;')(); console.log(JSON.stringify(m({rules:['MATCH,DIRECT'],'proxy-groups':[{name:'手动',proxies:['DIRECT']}]}),null,1))"
```

脚本对跨平台差异做了兼容：`PROCESS-NAME` 同时写 `ms-teams.exe`（Windows）和 `MSTeams`（macOS），
`DST-PORT` 两端通用；分组过滤按节点名里的 `[倍率:x]` / `[M]` 判断，因此在任何机场订阅上都成立。

### 统一分组命名

| 分组 |
|---|
| 🖱️ 手动选择 |
| 🚀 节点选择 |
| 🍎 苹果 |
| 🤖 AI |
| 💼 Teams |
| 🎵 网易云 |
| 📲 电报 |
| 🛑 广告拦截 |
| 🐟 兜底 |
| ♻️ 自动选择 |
| 🇭🇰 香港 |
| 🇯🇵 日本 |
| 🇺🇸 美国 |
| 🇹🇼 台湾 |
| 🇸🇬 新加坡 |
### Surge 侧的脚本 / 面板 / 计量网络（2026-10-31 补）

`tools/surge/` 下三个脚本配合 profile 里的声明使用：

| 文件 | profile 声明 | 作用 |
|---|---|---|
| `status-panel.js` | `[Panel]` + `type=generic` | 两个信息面板：AI 体检状态（当前节点/候选数/上次结果）、网络与出口（SSID/IP/关键组选择） |
| `network-event.js` | `type=event,event-name=network-changed / engine-started / profile-reloaded` | 网络变化时记录 SSID+内网 IP，变化时发通知；同一路径重复声明即共用脚本 |
| `ssid-rule.js` | `type=rule` + `[Rule] SCRIPT,ssid-rule,...` | 计量网络（iPhone 热点 172.20.10.0/28 或指定 SSID）下，未命中规则的流量改走低倍节点，省流量/倍率；家里网络不匹配，仍走 FINAL |

另外 AI 体检脚本同时用 `type=event,event-name=network-changed` 声明了一份，网络切换后立即重跑，不必等 30 分钟 cron。

MITM 扩展：hostname 增加 doubleclick / googlesyndication / googleadservices / adservice.google 四个广告域，并在 `[URL Rewrite]` 用 `reject` 丢弃，实测广告请求被拒、正常站点无影响。

#### 本轮未做（附原因）

| 项 | 原因 |
|---|---|
| mihomo `sub-rules` 收敛规则 | 官方 wiki 当前不可达，SUB-RULE 语义无法离线验证；只影响维护性、不影响功能，不值得拿线上配置试错 |
| mihomo-party 覆写层 | 应用未运行、`override.yaml` items schema 无法离线验证，写错会影响 Mac 备用配置 |
| Loon 脚本实机启用 | Loon 未运行，脚本语法/MITM 无法验证；已在 `[Script]` 处留注释模板 |

### mihomo sub-rules 与两机全局层（2026-10-31 补）

`sub-rules` 实测语义（用 mihomo 1.19.32 核心跑出来的）：子规则里每条规则**自带策略**，`SUB-RULE,(condition),name` 引用时**不带策略**；子规则内没有命中会**继续走外层规则**（不需要在子规则里写 MATCH 兜底）。

据此把两机 Clash 的 16 条自定义规则收进 `sub-rules.custom-route`，主 `rules` 只保留：

~~~yaml
rules:
  - SUB-RULE,(NETWORK,tcp),custom-route
  - SUB-RULE,(NETWORK,udp),custom-route
~~~

验证：PC runtime 96→82 条规则、Mac Clash Verge profile 76 条，两边各自用本机核心 `-t` 通过；PC 热重载后 chatgpt/teams/github 请求正常。

两机（Windows Clash Verge + macOS Clash Verge）都放了同一套 `Merge.yaml` + `Script.js`（见 `clash/verge/`）：脚本负责 emoji 归一、补高阶组、注入 sub-rules、规则去重；Merge 放跨平台静态项。

注意：Mac 上原先改的 `~/Library/Application Support/mihomo-party/work/config.yaml` 属于**已卸载应用**的遗留数据；Mac 实际在用的是 Clash Verge（`io.github.clash-verge-rev.clash-verge-rev`），已改为在该目录落地。

Loon 脚本仍未启用：Loon 无 CLI/配置校验，且运行时与 Surge 的 TUN 冲突会中断当前网络，只能等你方便时手动开 Loon 验证。

### Loon 侧的取舍（2026-10-31 实测）

- **Loon 分组不加 emoji**：Loon 用 `img-url` 图标（地区组已有 HK/TW/JP/KR/SG/US/Global 图标），组名保持纯文本：`香港/日本/新国/美国/台湾/韩国`、`香港手动`、`兜底`、`AI`、`Teams`、`高倍节点`、`低倍节点`、`媒体解锁`、`GitHub`。
- **AI 组用 url-test + chatgpt 探针**：`AI = url-test,美国节点,日本节点,新国节点,台湾节点,url = https://chatgpt.com/robots.txt`，只有能完成 ChatGPT 请求的节点会被选中。
- **Loon 脚本已启用**：`[Script]` 里直接写 remote URL 即可，Loon 会下载并缓存到
  `/Library/Application Support/com.loon.Loon/scripts/<md5(url)>.js` 再执行：
  `cron "*/30 * * * *" script-path=https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/loon/ai-check.js,tag=AI体检,enable=true,timeout=120`
- **AI 组必须是「策略组」，不能填节点过滤器名**（2026-11-01 修）：`AI = select,美国,日本,新国,台湾`。
  之前写成 `select,美国节点,日本节点,新国节点,台湾节点`，这些是 `[Remote Filter]` 的 NameRegex 节点过滤资源，不是策略组，
  Loon 解析策略时找不到 → 每次脚本切换都会报 `Policy match error: Can not find policy:<X>节点, use the global first node`，
  实际流量回落到全局第一个节点。Mac 端日志里同样出现（每小时 4 条），手机端同样，属于跨端同一个配置问题。
- `loon/ai-check.js` 的 `CANDIDATES` 同步为组名 `["美国","日本","新国","台湾"]`，探测时 `node` 传组名即可。
- 改脚本后要让两端重新拉取：URL 加 `?v=`（Loon 按 `md5(URL)` 缓存脚本），本次为 `ai-check.js?v=20261101c`。
- Loon 0.5.0 (Mac) 与 3.5.3 (iOS) 都支持新版脚本语法，配置里统一用：
  `cron "*/30 * * * *" then script("<url>") with tag="AI体检", timeout=120`。
- Mac 端重载配置的可靠方式：`osascript -e 'quit app "Loon"' && open -a Loon` 有时不会把配置推给系统扩展；
  用 `scutil --nc stop "Loon for Mac"; scutil --nc start "Loon for Mac"` 会重启隧道扩展并 `Load ... scripts` 重新加载。
- **缓存坑**：Loon 按 URL 的 md5 缓存，URL 内容更新不会重新拉取；改脚本后要么换 URL（加 `?v=`），
  要么把新内容直接写入 `<md5(url)>.js` 预置缓存。首次执行若还没下载完会返回 result:3，之后才正常。
- `loon/ai-check.js` 从 `$config.getConfig().all_policy_groups` 自动找 AI 组名（兼容无 emoji 命名），
  内容级检测四个地区组（OpenAI 401 + Gemini 200），当前节点不慢于最优 1.3 倍时保持，避免来回切。
- 实测：`result:0`，脚本日志 `[AI体检] 使用组名 AI` → 四组探测 → `切换 ... -> 日本节点`。
- 实测（Loon TUN 直连，不经 Surge）：youtube 200、chatgpt 200、GitHub release 5.0 MB/s、百度/QQ/B站 200（python 报证书错是因为插件对 baidu 开了 MITM，浏览器正常）。

### AI 组设计（2026-11-02 修正）

- **AI 组用 `url-test`，探测 URL 就是 Gemini 页面**：
  `AI = url-test,美国节点,日本节点,新国节点,台湾节点,url = https://gemini.google.com/app,interval = 300,tolerance = 50`
  这样能自动把「能连 Google 但访问不了 Gemini/Google AI 接口」的节点踢出局。
- 起因：之前 AI 组是 `select` + 脚本切换，实测 `$config.getConfig(group, member)` 在 Loon Mac 0.5.0 上并不会真正改选中项
  （`policy_select` 仍返回原节点），结果长期停在一个阻断 Google AI 的 AnyTLS 节点上：`google.com` 正常但
  `gemini.google.com` / `aistudio.google.com` / `generativelanguage.googleapis.com` 全部 TLS 失败。
- 同时把 `Google.lsr` 的策略从 `台湾` 改成 `AI`，让 `accounts.google.com`、`www.google.com` 与 Gemini 走同一出口，
  避免 Google 会话跨地区导致 Gemini 判定地区不可用。
- `loon/ai-check.js` 已改为**巡检脚本**（只探测和通知，不切换策略），cron */30。
- 另修：`高倍节点`/`低倍节点` 的过滤器与组同名造成自引用，过滤器已改名为 `高倍节点池`/`低倍节点池`。

### 关于模块 / 插件

模块（`.sgmodule`）和 Surge 6 的插件系统只是把 `[Script]` / `[Rule]` / MITM 打包分发，
检测逻辑本身仍要写脚本来实现。纯模块无法"指定策略发请求 + 改组选择"，必须依赖脚本 API。
需要跨设备复用时，可以把上面的脚本 + 声明打包成插件目录（`surge-cli plugin validate / load-unpacked / pack`）。

## License

MIT
