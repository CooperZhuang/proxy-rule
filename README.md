# proxy-rule

个人 Clash / mihomo 分流规则仓库。规则文件由 Python 爬虫（`crawler/update_rules.py`）自动更新，
并通过 GitHub Actions 每日自动运行，Clash 侧通过 `rule-providers` 定时拉取。

## 目录结构

```
proxy-rule/
├── rules/                        # 分流规则集（按客户端分专项目录）
│   ├── clash/                    # Clash / mihomo（*.txt）
│   │   ├── teams-us.txt          #   Microsoft 365/Teams 依赖端点 → 美国（自动生成）
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
| `teams-us.txt` | Microsoft 365 官方端点 JSON 提取：Teams / Common / Skype / Exchange / SharePoint 服务区域域名 + Teams/Skype 媒体 IP 段 | `美国` |
| `steam-direct.txt` | Steam 商店/CDN/社区国内直连域名（基础列表 + Femoon/clash-rules 上游合并） | `DIRECT` |
| `game-cdn-direct.txt` | 微软 / Xbox / Ubisoft / Epic 国内下载 CDN | `DIRECT` |
| `custom-direct.txt` | 手写直连规则（金山西山居、time.is 等） | `DIRECT` |
| `custom-fallback.txt` | 手写规则（网盘类） | `兜底` |

所有规则集在 `rules/surge/` 与 `rules/loon/` 下都有对应客户端的专项副本，由爬虫自动同步；
两个目录相互独立，便于将来 Surge / Loon 格式各自演化（专项专用）。

`teams-us.txt` 的数据源为微软官方发布的 365 端点清单：
<https://learn.microsoft.com/office365/enterprise/urls-and-ip-address-ranges>

生成时会剔除证书链校验（CRL/OCSP）端点（digicert/globalsign/verisign 等）及含通配符的条目
（如 `autodiscover.*.onmicrosoft.com`，由已有的 `onmicrosoft.com` 覆盖）。

## 组名约定

Clash / Surge / Loon 三端统一精简组名（无 emoji 前缀）：

| 类型 | 组名 |
|---|---|
| 地区自动优选（url-test） | `香港` `台湾` `日本` `韩国` `新国` `美国` `游戏` `全球` |
| Loon 手动选择（select） | `香港手动` `台湾手动` `日本手动` `韩国手动` `新国手动` `美国手动` `游戏手动` `全球手动` |
| 兜底（FINAL / fallback） | `兜底` |
| Clash 功能组 | `手动` `加速` `苹果` `AI` `网易云` `电报` `拦截` `自动` |
| 内置策略 | `DIRECT` `REJECT-DROP` `REJECT`（Loon 另有 `Apple Push`） |

- 规则集引用的组：`teams-us` → `美国`；`custom-fallback` → `兜底`；其余直连规则 → `DIRECT`
- Surge 内嵌策略名在 `SURGE_POLICIES` 维护；Loon 策略在 `[Remote Rule]` 导入时指定

## 在 Surge / Loon 中使用

**Surge**：`rules/surge/` 规则集内嵌策略（与 Clash 分组名一致：`美国` / `DIRECT` / `兜底`），
IP 规则已追加 `no-resolve`。策略名在 `crawler/update_rules.py` 的 `SURGE_POLICIES` 中修改。

```
[Rule]
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/teams-us.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/steam-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/game-cdn-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/custom-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/surge/custom-fallback.txt
```

**Loon**：`rules/loon/` 为裸规则列表（不含策略），策略在 `[Remote Rule]` 导入时用 `policy=` 指定
（与 kelee.one / skk.moe 规则集惯例一致），可自由路由到任意策略组：

```
[Remote Rule]
https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/loon/teams-us.lsr, policy=美国, tag=proxy-rule Teams→US, enabled=true
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
  teams_us:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/clash/teams-us.txt
    path: ./ruleset/teams_us.txt
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
  - RULE-SET,teams_us,美国
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

- 需要调整 Teams 覆盖范围：修改 `crawler/update_rules.py` 中的
  `TEAMS_DOMAIN_AREAS` / `TEAMS_IP_AREAS` / `CERT_CRL_DOMAINS` 后重新运行爬虫。
- 手工规则直接编辑 `rules/clash/*.txt`（`teams-us.txt` 除外，会被爬虫覆盖）；
  修改后运行一次爬虫即可同步 `rules/surge/*.txt` 与 `rules/loon/*.lsr` 专项格式。
- Surge 内嵌策略名：编辑 `crawler/update_rules.py` 的 `SURGE_POLICIES`。
- Loon 策略在配置导入时指定（裸规则），与规则文件解耦。
- Surge 与 Loon 格式各自独立：`crawler/update_rules.py` 的 `_write_surge` / `_write_loon`
  分别生成，互不影响（`SURGE_DIR` / `LOON_DIR`）。

## License

MIT
