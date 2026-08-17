# proxy-rule

个人 Clash / mihomo 分流规则仓库。规则文件由 Python 爬虫（`crawler/update_rules.py`）自动更新，
并通过 GitHub Actions 每日自动运行，Clash 侧通过 `rule-providers` 定时拉取。

## 目录结构

```
proxy-rule/
├── rules/                        # 分流规则集（rule-providers 拉取的目标）
│   ├── teams-us.txt              # Microsoft 365/Teams 依赖端点 → 🇺🇲 美国节点（自动生成）
│   ├── steam-direct.txt          # Steam 直连（基础手工维护 + 上游自动合并）
│   ├── game-cdn-direct.txt       # 游戏平台下载 CDN 直连（手工维护）
│   ├── custom-direct.txt         # 手写自定义直连规则（手工维护）
│   ├── custom-fallback.txt       # 手写自定义规则 → 兜底分流组（手工维护）
│   └── universal/                # Surge / Loon 通用格式副本（爬虫自动生成）
├── crawler/
│   ├── update_rules.py           # 规则更新爬虫
│   └── requirements.txt
└── .github/workflows/update-rules.yml  # 每日自动更新 + 自动提交
```

## 规则说明

| 文件 | 内容 | Clash 目标 |
|---|---|---|
| `teams-us.txt` | Microsoft 365 官方端点 JSON 提取：Teams / Common / Skype / Exchange / SharePoint 服务区域域名 + Teams/Skype 媒体 IP 段 | `🇺🇲 美国节点` |
| `steam-direct.txt` | Steam 商店/CDN/社区国内直连域名（基础列表 + Femoon/clash-rules 上游合并） | `DIRECT` |
| `game-cdn-direct.txt` | 微软 / Xbox / Ubisoft / Epic 国内下载 CDN | `DIRECT` |
| `custom-direct.txt` | 手写直连规则（金山西山居、time.is 等） | `DIRECT` |
| `custom-fallback.txt` | 手写规则（网盘类） | `🐟 兜底分流` |

所有规则集在 `rules/universal/` 下都有 Surge / Loon 通用格式副本，由爬虫自动同步。

`teams-us.txt` 的数据源为微软官方发布的 365 端点清单：
<https://learn.microsoft.com/office365/enterprise/urls-and-ip-address-ranges>

生成时会剔除证书链校验（CRL/OCSP）端点（digicert/globalsign/verisign 等）及含通配符的条目
（如 `autodiscover.*.onmicrosoft.com`，由已有的 `onmicrosoft.com` 覆盖）。

## 在 Surge / Loon 中使用

`rules/universal/` 下的规则集为两客户端通用格式：每条规则自带策略
（与 Clash 分组名一致：`🇺🇲 美国节点` / `DIRECT` / `🐟 兜底分流`），
IP 规则已追加 `no-resolve`。策略名可在 `crawler/update_rules.py` 的
`UNIVERSAL_POLICIES` 中修改，改后重新运行爬虫即可。

**Surge**（`[Rule]` 段）：

```
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/teams-us.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/steam-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/game-cdn-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/custom-direct.txt
Rule Set = https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/custom-fallback.txt
```

**Loon**（`[Rule]` 段）：

```
RULE-SET,https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/teams-us.txt
RULE-SET,https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/steam-direct.txt
RULE-SET,https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/game-cdn-direct.txt
RULE-SET,https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/custom-direct.txt
RULE-SET,https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/universal/custom-fallback.txt
```

raw.githubusercontent 备用链接：`https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/universal/<file>`

## 在 Clash / mihomo 中使用

在 `rule-providers` 中添加（示例以 jsdelivr CDN 为主，国内可达；也可换用 raw 链接）：

```yaml
rule-providers:
  teams_us:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/teams-us.txt
    path: ./ruleset/teams_us.txt
  steam_direct:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/steam-direct.txt
    path: ./ruleset/steam_direct.txt
  game_cdn_direct:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/game-cdn-direct.txt
    path: ./ruleset/game_cdn_direct.txt
  custom_direct:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/custom-direct.txt
    path: ./ruleset/custom_direct.txt
  custom_fallback:
    type: http
    behavior: classical
    format: text
    interval: 43200
    url: https://cdn.jsdelivr.net/gh/CooperZhuang/proxy-rule@main/rules/custom-fallback.txt
    path: ./ruleset/custom_fallback.txt
```

`rules` 中引用（注意放在 skk.moe 等通用规则之前，保持原优先级）：

```yaml
rules:
  - RULE-SET,teams_us,🇺🇲 美国节点
  - RULE-SET,custom_direct,DIRECT
  - RULE-SET,custom_fallback,🐟 兜底分流
  - RULE-SET,steam_direct,DIRECT
  - RULE-SET,game_cdn_direct,DIRECT
```

raw.githubusercontent 备用链接：`https://raw.githubusercontent.com/CooperZhuang/proxy-rule/main/rules/<file>`

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
- 手工规则直接编辑 `rules/*.txt`（`teams-us.txt` 除外，会被爬虫覆盖）；
  修改后运行一次爬虫即可同步 `rules/universal/` 通用格式。
- Surge/Loon 策略名：编辑 `crawler/update_rules.py` 的 `UNIVERSAL_POLICIES`。

## License

MIT
