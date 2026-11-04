# Loon → Surge 6.11 (Mac) 模块映射清单

输入：`~/Library/Mobile Documents/iCloud~com~ruikq~decar/Documents/Configs/default-optimized.lcf` 的 `[Plugin]` 段（205–291 行）。
产出：本文件。只做了只读探测，未改任何 Surge 配置/profile，未运行 surge-cli 的 switch/reload/module install。

## 0. 结论数字

文档里逐条判定的条目按文件实测是 **79 条**（不是任务描述里的 85）：`[Plugin]` 段 205–291 行内非注释、非空行正好 79 行，其中 **61 条 enabled=true、18 条 enabled=false**。文件第 208 行注释自称「以下 90 项」、第 303 行写「75 启用项」，都是历史口径，与当前内容不符。

| 判定 | 条数 | 含义 |
|---|---|---|
| a 原生/同作者官方 .sgmodule | 5 | 直接装，URL 已验证 |
| b 社区等价 .sgmodule | 39 | 同 App 去广告功能的 Surge 版，URL 已验证 |
| c 需自建 | 3 | 有 Loon/QX 正文可转，摘要见 §4 |
| d 不必迁移 | 8 | 无 Surge 对应机制或已被覆盖 |
| 待定 | 6 | 源被 Cloudflare 403 挡住且无镜像，正文取不到 |
| 保持禁用 | 18 | 原配置 enabled=false |

**落地去重提醒**：230/242（Damai）、257/289（CaiYunWeather）、267/278（HangLvZongHeng）、206/223（HTTPDNS.Block）指向同一模块，Surge 里只装一份，重复装会让同一批规则/脚本加载两次。

## 1. 探测环境（2026-11-04，本机实测）

| 目标 | 实测结果 | 影响 |
|---|---|---|
| `kelee.one`（44 条 Loon 插件源） | `403` Cloudflare「Attention Required」，响应头 `cf-ray: …-AMS`；`.lpx` 与 `.sgmodule` 路径**一律** 403（连已知存在的 .lpx 也 403） | 状态码无法区分「路径不存在」与「整站被拦」，kelee 侧只能靠 GitHub 镜像判定 |
| `script.hub`（13 条 ScriptHub 包裹源） | DNS 无解析（`dig +short` 返回空），`Could not resolve host` | 这些包裹 URL 在当前网络下本身就取不到内容 |
| `rucu6.pages.dev` | `302 Location: https://t.me/GitCube`，插件路径已迁移到 Telegram | 原 `.lpx` 地址失效（xiaohongshu、youtube_2） |
| `ddgksf2013.top` | 任意路径都返回 `200 / 77816B` 的 HTML（站点 SPA 首页） | conf/module 路径已失效 |
| `raw.githubusercontent.com` | 本轮多次 `000`（超时 45s） | Surge 装模块时若走 raw 会失败 |
| `cdn.jsdelivr.net` | `200`，稳定 | 本文所有 URL 用 jsdelivr 镜像，已逐条验证 |
| `api.github.com` | `200` | 用它枚举 VirgilClyne / NobyDa / zqzess / fmz200 / ddgksf2013 的仓库文件树做同名匹配 |

## 2. 判定口径与格式说明

- a：同一作者提供原生 `.sgmodule`（ VirgilClyne/GetSomeFries、NobyDa/Script、zqzess/rule_for_quantumultX ）。
- b：社区库 `fmz200/wool_scripts` 里按 App 名对应的 Surge 模块，功能等价但非原作者。
- c：没有现成 Surge 版，但有 Loon/QX 正文可转；§4 给出来源与要提取的节。
- d：Loon 专属机制（Gallery/Panel）或已被其它模块覆盖，搬过来是负收益。

格式不兼容这件事必须说清：Loon 的 `.lpx`/`.plugin` 用 `[Rewrite]`、`[Script]` 的 Loon 方言（`http-response … script-path=…`、`[Argument]`、`[Mitm]`），Surge 只认 `[URL Rewrite]`、`[Map Local]`、`[Body Rewrite]`、`[Script]`（`type=http-response,pattern=…,script-path=…`）、`[MITM]`。抓到 `.lpx` 不能直接改名成 `.sgmodule`；要转换节名和参数名，并且 Surge 模块建议带 `#!REQUIREMENT` 说明依赖。

## 3. 逐条判定

| # | Loon 条目 | 作用 | 判定 | Surge 落地（URL / 说明） | 验证证据 |
|---|---|---|---|---|---|
| 206 | HTTPDNS.Block.plugin | 阻断 App 用 HTTPDNS 绕过代理 | a 原生 | https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/HTTPDNS.Block.sgmodule | 200 / 10878B / [General]+[Rule 83]+[URL Rewrite 51]+[Map Local 2]+[MITM 6] |
| 207 | DNS.plugin | DNS 按归属分流 + 216 条 Host 映射 | a 原生 | https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/DNS.sgmodule | 200 / 18207B / [General 2]+[Host 216]（无 MITM） |
| 211 | GoogleCAPTCHA.sgmodule | 缓解 Google 搜索人机验证频发 | a 原生 | https://cdn.jsdelivr.net/gh/NobyDa/Script@master/Surge/Module/GoogleCAPTCHA.sgmodule | 200 / 885B / [Script 1]+[MITM www.google.com*] |
| 212 | ScriptHub.Loon.plugin | QX/Surge 插件格式在线转换器（Loon 端中间层） | d 不迁移 | — | 转换器本身；Surge 直接装原生 .sgmodule，无需该层。且 ddgksf2013.top 全路径现返 77816B SPA 首页 |
| 213 | xiaohongshu.lpx | 小红书去广告/净化 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partX/Xiaohongshu.sgmodule | 200 / 5426B / [Rule 5]+[Map Local 7]+[Script 12]+[MITM 10] |
| 214 | OraySunlogin_remove_ads.lpx | 向日葵远控去广告 | 保持禁用 | — | 保持禁用；若要启用改用 fmz Oray.sgmodule（200 / 466B / [URL Rewrite 2]+[MITM 1]） |
| 215 | Sub-Store.lpx | 订阅管理/转换面板 | 保持禁用 | — | 保持禁用；Surge 无等价物（Sub-Store 是 Loon/QX 端脚本+面板，Surge 用原生订阅/策略组） |
| 216 | ReFix.plugin | 重写规则修复引擎（补被上游改死的 rewrite） | b 社区 | https://cdn.jsdelivr.net/gh/zqzess/rule_for_quantumultX@master/Surge/Module/ReFix.sgmodule | 200 / 2958B / [Rule 70] |
| 217 | General.plugin | 通用增强：跳过代理段 / 返回真实 IP / 不可 MitM 白名单 | a 原生 | https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/General.mac.sgmodule | 200 / 3044B / [General 2]+[MITM 2]；文件头 #!system=mac，是 Mac 专用版 |
| 218 | AppleWeatherEnhancer.lpx | 苹果天气数据增强 | d 不迁移 | — | kelee.one 403 取不到正文、镜像库无此文件；同能力由 217 GSF General 的 always-real-ip + DNS 部分覆盖 |
| 219 | Weixin_external_links_unlock.lpx | 微信外链直接打开 | 保持禁用 | — | 保持禁用；若要启用改用 fmz WeChatUnlockLinkRestrict.sgmodule |
| 220 | QQ_Redirect.lpx | QQ 内置浏览器链接跳转修复 | d 不迁移 | — | kelee.one 403、镜像库无同名文件；Mac 上无 QQ iOS 内置浏览器进程，重写不会命中 |
| 221 | BaiduSearchWebpage_remove_ads.lpx | 百度搜索/网页去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/Baidu.sgmodule | 200 / 7134B / [Rule 148]+[URL Rewrite 8]+[Map Local 6]+[MITM 12] |
| 222 | LoonGallery.lpx | Loon 插件画廊 UI | d 不迁移 | — | Loon 专属 UI；Surge 模块靠 URL 直装，无 Gallery/Panel 机制 |
| 223 | Block_HTTPDNS.lpx | 拦 HTTPDNS 直连绕过代理 | a 原生 | https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/HTTPDNS.Block.sgmodule | 与 206 同功能同源；Loon 版镜像被 jsdelivr 以「超过 50MB 限制」拒绝，无法逐字比对 |
| 224 | BlockAdvertisers.lpx | 广告联盟域名拦截 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/part!!/AffiliateMarketing.sgmodule | 200 / 17336B / [Rule 391]（纯 Rule） |
| 225 | Prevent_DNS_Leaks.lpx | 阻止 App 走 DoH/DoT/私有 DNS 防泄漏 | 待定 | — | 待定：GSF DNS.sgmodule 只做分流/Host 映射，不含 DoH 阻断；kelee 源 403 无比对正文。临时替代＝206 + 自加 REJECT 规则 |
| 226 | Node_detection_tool.lpx | 面板显示当前出口节点/命中检测 | d 不迁移 | — | 依赖 Loon Panel 机制；Surge 无 Panel |
| 230 | DaMaiAds.sgmodule | 大麦 App/H5 去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/Damai.sgmodule | 200 / 603B / [URL Rewrite 1]+[Map Local 1]+[MITM 2] |
| 231 | ZhuanZhuan_remove_ads.lpx | 转转去广告 | 保持禁用 | — | 保持禁用；若要启用改用 fmz ZhuanZhuan.sgmodule |
| 232 | CosmosPodcast_remove_ads.lpx | 小宇宙播客去广告 | 保持禁用 | — | 保持禁用；若要启用改用 fmz XiaoYuZhou.sgmodule（200 / 1271B） |
| 233 | Weibo_remove_ads.lpx | 微博去广告/净化 | c 自建 | — | 自建，见 §4。源：fmz Loon/plugin/weibo.plugin 200 / 9617B / [Rule 32]+[Rewrite 18]+[Script 17]+[MITM 3]（Loon 方言不可直用） |
| 234 | JD_Price.lpx | 京东价格走势（依赖 BoxJs） | 保持禁用 | — | 保持禁用 |
| 235 | Amap_remove_ads.lpx | 高德地图去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partG/AutoNavi.sgmodule | 200 / 1337B / [Rule 14]+[URL Rewrite 2]+[Map Local 2]+[MITM 3] |
| 236 | XWebAds.plugin | X(Twitter) 网页版去广告 | c 自建 | — | 自建，见 §4。源：fmz Loon/plugin/XWebAds.plugin 200 / 746B / [Script 1]+[MITM x.com] |
| 237 | hlwxx_remove_ads.plugin | 小众站点去广告 | 保持禁用 | — | 保持禁用 |
| 238 | javdbapp.ads.sgmodule | JavDB App 去广告 | d 不迁移 | — | ScriptHub 转换链依赖 ddgksf2013.top（现返 77816B SPA 页），ddgksf2013/Scripts 无同名 js，正文取不到 |
| 239 | missav.ads.sgmodule | MissAV 网页去广告 | d 不迁移 | — | 同 238 |
| 240 | Applet.sgmodule | 微信小程序通用去广告 | c 自建 | — | 自建，见 §4。源：ddgksf2013 AdBlock/Applet.conf 200 / 2933B / hostname 段 37 项 |
| 241 | StartUpAds.sgmodule | 通用开屏广告清除（墨鱼，覆盖 400+ App） | 待定 | — | 待定：原 .conf 不在 ddgksf2013/Rewrite 仓库（只有 Scripts/startup.js），需按 js 自写 [Script] 壳 |
| 242 | Damai_remove_ads.lpx | 大麦 App 去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/Damai.sgmodule | 与 230 同一文件：200 / 603B |
| 243 | DingdongMaicai_remove_ads.lpx | 叮咚买菜去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/DingDongMaiCai.sgmodule | 200 / 2593B / [Rule 3]+[URL Rewrite 3]+[Body Rewrite 1]+[Map Local]+[MITM 3] |
| 244 | WPS_Documents_remove_ads.lpx | WPS 文档去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/WPS.sgmodule | 200 / 450B / [URL Rewrite 1]+[MITM 2] |
| 245 | TXDocs_remove_ads.lpx | 腾讯文档去广告 | 待定 | — | 待定：kelee 403、镜像库无同名文件 |
| 246 | jd_price2.plugin | 京东价格（新版，依赖 BoxJs） | 保持禁用 | — | 保持禁用 |
| 247 | PinDuoDuo_remove_ads.lpx | 拼多多去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partP/Pinduoduo.sgmodule | 200 / 827B / [URL Rewrite 1]+[Body Rewrite 1]+[Map Local 1]+[MITM 3] |
| 248 | SF-Express_remove_ads.lpx | 顺丰去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partS/SFExpress.sgmodule | 200 / 1135B / [Map Local 4]+[MITM 2] |
| 249 | LuckinCoffee_remove_ads.lpx | 瑞幸咖啡去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partR/LuckinCoffee.sgmodule | 200 / 1127B / [Body Rewrite 3]+[Map Local 2]+[MITM 4] |
| 250 | YouTube_remove_ads.lpx | YouTube 去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partY/YouTube.sgmodule | 200 / 972B / [Map Local 1]+[Script 1]+[MITM 2] |
| 251 | RedPaper_remove_ads.lpx | 红板报去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partH/HongBanBao.sgmodule | 200 / 448B / [URL Rewrite 1]+[MITM 1] |
| 252 | Cainiao_remove_ads.lpx | 菜鸟去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partC/CaiNiaoGuoGuo.sgmodule | 200 / 3363B / [URL Rewrite 1]+[Map Local 9]+[Script 4]+[MITM 2]（文件名为「菜鸟裹裹」，规则含 cn-acs.m.cainiao.com） |
| 253 | Bilibili_remove_ads.lpx | B 站去广告/净化 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/bilibili.sgmodule | 200 / 15580B / [Rule 5]+[Header Rewrite 1]+[Body Rewrite 10]+[MITM 5] |
| 254 | NeteaseCloudMusic_remove_ads.lpx | 网易云音乐去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/NetEaseCloudMusic.sgmodule | 200 / 4368B / [Rule 5]+[Map Local 5]+[Script 6]+[MITM 4] |
| 255 | Zhihu_remove_ads.lpx | 知乎去广告/净化 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partZ/Zhihu.sgmodule | 200 / 7727B / [Rule 18]+[URL Rewrite 9]+[Body Rewrite 1]+[MITM 6] |
| 256 | Google.lpx | Google 搜索净化/去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partG/Google.sgmodule | 200 / 2843B / [Rule 52]+[Map Local 4]+[MITM 1] |
| 257 | CaiYunAds.plugin | 彩云天气会员/去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partC/CaiYunWeather.sgmodule | 200 / 663B / [Map Local 2]（无 MITM） |
| 258 | Keep_remove_ads.lpx | Keep 去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partK/Keep.sgmodule | 200 / 2968B / [Rule 5]+[URL Rewrite 11]+[Map Local 1]+[Script 5]+[MITM 3] |
| 259 | YoudaoDict_remove_ads.lpx | 有道词典去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/NetEaseYoudaoDictionary.sgmodule | 200 / 2541B / [URL Rewrite 1]+[Map Local 11]+[Script 1]+[MITM 8] |
| 260 | Douyu_remove_ads.lpx | 斗鱼去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/DouyuLive.sgmodule | 200 / 1448B / [Rule 3]+[URL Rewrite 5]+[Map Local 5]+[MITM 5] |
| 261 | BiliComic_remove_ads.lpx | B 站漫画去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/BilibiliComics.sgmodule | 200 / 2633B / [Map Local 8]+[Script 4]+[MITM 2] |
| 262 | XiaoHeiHe_remove_ads.lpx | 小黑盒去广告 | 待定 | — | 待定：kelee 403、镜像库无同名文件 |
| 263 | DiDi_remove_ads.lpx | 滴滴出行去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/DiDiChuxing.sgmodule | 200 / 3225B / [Map Local 1]+[Script 10]+[MITM 7] |
| 264 | SevenCat_remove_ads.lpx | 七猫小说去广告 | b 社区 | https://cdn.jsdelivr.net/gh/zqzess/rule_for_quantumultX@master/Surge/Module/SevenCat.sgmodule | 200 / 1234B / [Rule 17]+[MITM 7] |
| 265 | Taobao_remove_ads.lpx | 淘宝去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partT/Taobao.sgmodule | 200 / 3812B / [Rule 32]+[Map Local 9]+[Script 2]+[MITM 3] |
| 266 | JD_remove_ads.lpx | 京东去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partJ/JD.com.sgmodule | 200 / 1442B / [Rule 16]+[URL Rewrite 1]+[Script 1]+[MITM 2] |
| 267 | Umetrip_remove_ads.lpx | 航旅纵横去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partH/HangLvZongHeng.sgmodule | 200 / 955B / [URL Rewrite 2]+[Script 1]+[MITM 4] |
| 268 | iQiYi_Video_remove_ads.lpx | 爱奇艺去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partA/iQIYI.sgmodule | 200 / 6482B / [Rule 45]+[Map Local 4]+[Script 13]+[MITM 2] |
| 269 | WexinMiniPrograms_Remove_ads.lpx | 微信小程序广告 | 待定 | — | 待定：fmz 只有 Loon 版 WeChatMiniAds.plugin，无 Surge 版；功能与 240 重叠，建议并入 240 后删掉本条 |
| 270 | Weixin_Official_Accounts_remove_ads.lpx | 微信公众号内广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/WeChatOfficialAccount.sgmodule | 200 / 671B / [Body Rewrite 1]+[Map Local 1]+[MITM 1] |
| 271 | QQMusic_remove_ads.lpx | QQ 音乐去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partQ/QQMusic.sgmodule | 200 / 2136B / [Rule 32]+[URL Rewrite 5]+[Map Local 2]+[MITM 3] |
| 272 | BaiduNetDisk_remove_ads.lpx | 百度网盘去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/BaiduNetdisk.sgmodule | 200 / 1607B / [URL Rewrite 17]+[MITM 7] |
| 273 | IThome_remove_ads.lpx | IT 之家去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partI/ITHome.sgmodule | 200 / 640B / [Script 1]（无 MITM） |
| 274 | QiDian_remove_ads.lpx | 起点读书去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partQ/QiDianReading.sgmodule | 200 / 1931B / [URL Rewrite 5]+[Map Local 7]+[MITM 3] |
| 275 | Remove_ads_by_keli.lpx | 可莉去广告合集（杂项 App） | d 不迁移 | — | 合集与本次各 App 独立模块重复，且会与其他模块撞规则；逐项已覆盖 |
| 276 | QuickSearch.lpx | 快捷搜索（Loon 面板） | 保持禁用 | — | 保持禁用；若要启用改用 zqzess Qsearch.sgmodule |
| 278 | UmetripAds.sgmodule | 航旅纵横开屏/净化 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partH/HangLvZongHeng.sgmodule | 与 267 同一文件：200 / 955B |
| 279 | youtube_2.lpx | 旧版 YouTube 去广告 | 保持禁用 | — | 保持禁用（250 已覆盖） |
| 280 | iRingo.Maps.plugin | Apple 地图数据增强 | 保持禁用 | — | 保持禁用 |
| 281 | iRingo.Siri.plugin | Siri 增强 | 保持禁用 | — | 保持禁用 |
| 282 | iRingo.WeatherKit.plugin | 天气数据源替换 | 保持禁用 | — | 保持禁用 |
| 283 | heiliao.sgmodule | 黑料聚合去广告 | 保持禁用 | — | 保持禁用（Loon 载入时仍报 2 条脚本无法解析） |
| 284 | BoxJs.lpx | BoxJs 面板/脚本后端 | 保持禁用 | — | 保持禁用 |
| 285 | keep.plugin | Keep 去广告（deezertidal 版） | 保持禁用 | — | 保持禁用 |
| 286 | Switch_repository_source.lpx | 切换订阅源 | 保持禁用 | — | 保持禁用 |
| 287 | Switch_github_mirror.lpx | 切换 GitHub 镜像 | 保持禁用 | — | 保持禁用 |
| 288 | FleaMarket_remove_ads.lpx | 闲鱼去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partX/XianYu.sgmodule | 200 / 4794B / [Rule 2]+[URL Rewrite 1]+[Body Rewrite 8]+[Map Local]+[MITM 2] |
| 289 | ColorfulClouds_remove_ads.lpx | 彩云天气去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partC/CaiYunWeather.sgmodule | 与 257 同一文件：200 / 663B |
| 290 | 12306_remove_ads.lpx | 12306 去广告 | b 社区 | https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/part1/12306.sgmodule | 200 / 589B / [Script 1]+[MITM 1] |
| 291 | DragonRead_remove_ads.lpx | 龙读去广告 | 待定 | — | 待定：kelee 403、镜像库无同名文件 |

## 4. 自建项（c）与待定项的可执行细节

### #236 XWebAds.plugin —— 最小自建，可直接抄

原文（fmz Loon/plugin/XWebAds.plugin，200 / 746B）只有 1 条 `[Script]` + `[MITM]`，作用就是**移除网页版 X(Twitter) 的广告**（不是任务清单里旧备注写的「腾讯 X5 内核」，旧 inventory 那条是错的）。转成 Surge 只需 6 行：

```
#!name=X 网页版去广告
#!desc=移除 x.com 时间线与推文详情里的广告
#!REQUIREMENT=需开启 MITM 且信任 Surge CA
[Script]
X Ads = type=http-response,pattern=^https?:\/\/x\.com\/i\/api\/graphql\/[^\/]+\/(HomeTimeline|HomeLatestTimeline|TweetDetail),requires-body=true,max-size=0,script-path=https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Scripts/X/X_ads.js
[MITM]
hostname = x.com
```

### #233 Weibo_remove_ads.lpx —— 自建（推荐用 ddgksf conf 作正文来源）

两个可用来源，二选一：

1. `fmz200/wool_scripts/main/Loon/plugin/weibo.plugin`（200 / 9617B）：`[Argument]` + `[Rule]` 32 条 + `[Rewrite]` 18 条 + `[Script]` 17 条 + `[MITM]` 3 主机（`mapi.weibo.com`、`api.weibo.cn`、`*.uve.weibo.com`）。这是 Loon 方言，`[Rewrite]` 要改写成 Surge `[URL Rewrite]`，`[Script]` 的 `http-response` 要改 `type=http-response,pattern=…,script-path=…`。
2. `ddgksf2013/Rewrite/master/AdBlock/WeiboAds.conf`（200 / 19438B / 6 主机）——QX 方言，转换量比 Loon 小。

**Mac 取舍**：微博没有 Mac 客户端，这套规则只对浏览器访问 `weibo.com` 时生效，收益仅限网页版。若不做网页版微博，本条可以直接按 d 丢弃。

### #240 Applet.sgmodule —— 自建（微信小程序去广告）

来源 `ddgksf2013/Rewrite/master/AdBlock/Applet.conf`（200 / 2933B，`hostname` 段 37 项）。QX 的 `[rewrite_local]` 逐条转 Surge `[URL Rewrite]`，`[mitm]` 转 `[MITM]`。同功能的 Loon 版还有 `fmz200/wool_scripts/main/Loon/plugin/WeChatMiniAds.plugin`（本轮未取到正文）。

### 待定 6 条：为什么定不了、怎么解锁

| # | 条目 | 阻塞点 | 解锁办法 |
|---|---|---|---|
| 225 | Prevent_DNS_Leaks.lpx | kelee 403；GSF DNS.sgmodule 只做分流/Host，不含 DoH 阻断 | 从 Loon 客户端导出该插件正文，或直接用「REJECT 所有已知 DoH 端点」的规则替代 |
| 241 | StartUpAds.sgmodule | 原 conf 不在 ddgksf2013/Rewrite 仓库（只有 `Scripts/startup.js`） | 按 startup.js 写 `[Script] type=http-response` 壳 + 原 conf 的 URL 列表 |
| 245 | TXDocs_remove_ads.lpx | kelee 403、镜像库无同名文件 | 同 225 |
| 262 | XiaoHeiHe_remove_ads.lpx | 同上 | 同上（小黑盒有网页版 xiaoheihe.cn，值得补） |
| 269 | WexinMiniPrograms_Remove_ads.lpx | fmz 只有 Loon 版，无 Surge 版 | 建议并入 #240，不单独做 |
| 291 | DragonRead_remove_ads.lpx | kelee 403、无镜像 | 同 225；龙读无 Mac 客户端，也可直接丢 |

## 5. A. 启用清单（enabled=true 的 61 条）

- 206 HTTPDNS.Block.plugin → https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/HTTPDNS.Block.sgmodule
- 207 DNS.plugin → https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/DNS.sgmodule
- 211 GoogleCAPTCHA.sgmodule → https://cdn.jsdelivr.net/gh/NobyDa/Script@master/Surge/Module/GoogleCAPTCHA.sgmodule
- 212 ScriptHub.Loon.plugin → 丢弃：转换器本身；Surge 直接装原生 .sgmodule，无需该层。且 ddgksf2013.top 全路径现返 77816B SPA 首页
- 213 xiaohongshu.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partX/Xiaohongshu.sgmodule
- 216 ReFix.plugin → https://cdn.jsdelivr.net/gh/zqzess/rule_for_quantumultX@master/Surge/Module/ReFix.sgmodule
- 217 General.plugin → https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/General.mac.sgmodule
- 218 AppleWeatherEnhancer.lpx → 丢弃：kelee.one 403 取不到正文、镜像库无此文件；同能力由 217 GSF General 的 always-real-ip + DNS 部分覆盖
- 220 QQ_Redirect.lpx → 丢弃：kelee.one 403、镜像库无同名文件；Mac 上无 QQ iOS 内置浏览器进程，重写不会命中
- 221 BaiduSearchWebpage_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/Baidu.sgmodule
- 222 LoonGallery.lpx → 丢弃：Loon 专属 UI；Surge 模块靠 URL 直装，无 Gallery/Panel 机制
- 223 Block_HTTPDNS.lpx → https://cdn.jsdelivr.net/gh/VirgilClyne/GetSomeFries@main/sgmodule/HTTPDNS.Block.sgmodule
- 224 BlockAdvertisers.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/part!!/AffiliateMarketing.sgmodule
- 225 Prevent_DNS_Leaks.lpx → 待定：GSF DNS.sgmodule 只做分流/Host 映射，不含 DoH 阻断；kelee 源 403 无比对正文。临时替代＝206 + 自加 REJECT 规则
- 226 Node_detection_tool.lpx → 丢弃：依赖 Loon Panel 机制；Surge 无 Panel
- 230 DaMaiAds.sgmodule → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/Damai.sgmodule
- 233 Weibo_remove_ads.lpx → 自建，见 §4 #233
- 235 Amap_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partG/AutoNavi.sgmodule
- 236 XWebAds.plugin → 自建，见 §4 #236
- 238 javdbapp.ads.sgmodule → 丢弃：ScriptHub 转换链依赖 ddgksf2013.top（现返 77816B SPA 页），ddgksf2013/Scripts 无同名 js，正文取不到
- 239 missav.ads.sgmodule → 丢弃：同 238
- 240 Applet.sgmodule → 自建，见 §4 #240
- 241 StartUpAds.sgmodule → 待定：原 .conf 不在 ddgksf2013/Rewrite 仓库（只有 Scripts/startup.js），需按 js 自写 [Script] 壳
- 242 Damai_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/Damai.sgmodule
- 243 DingdongMaicai_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/DingDongMaiCai.sgmodule
- 244 WPS_Documents_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/WPS.sgmodule
- 245 TXDocs_remove_ads.lpx → 待定：kelee 403、镜像库无同名文件
- 247 PinDuoDuo_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partP/Pinduoduo.sgmodule
- 248 SF-Express_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partS/SFExpress.sgmodule
- 249 LuckinCoffee_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partR/LuckinCoffee.sgmodule
- 250 YouTube_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partY/YouTube.sgmodule
- 251 RedPaper_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partH/HongBanBao.sgmodule
- 252 Cainiao_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partC/CaiNiaoGuoGuo.sgmodule
- 253 Bilibili_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/bilibili.sgmodule
- 254 NeteaseCloudMusic_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/NetEaseCloudMusic.sgmodule
- 255 Zhihu_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partZ/Zhihu.sgmodule
- 256 Google.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partG/Google.sgmodule
- 257 CaiYunAds.plugin → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partC/CaiYunWeather.sgmodule
- 258 Keep_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partK/Keep.sgmodule
- 259 YoudaoDict_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/NetEaseYoudaoDictionary.sgmodule
- 260 Douyu_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/DouyuLive.sgmodule
- 261 BiliComic_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/BilibiliComics.sgmodule
- 262 XiaoHeiHe_remove_ads.lpx → 待定：kelee 403、镜像库无同名文件
- 263 DiDi_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partD/DiDiChuxing.sgmodule
- 264 SevenCat_remove_ads.lpx → https://cdn.jsdelivr.net/gh/zqzess/rule_for_quantumultX@master/Surge/Module/SevenCat.sgmodule
- 265 Taobao_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partT/Taobao.sgmodule
- 266 JD_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partJ/JD.com.sgmodule
- 267 Umetrip_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partH/HangLvZongHeng.sgmodule
- 268 iQiYi_Video_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partA/iQIYI.sgmodule
- 269 WexinMiniPrograms_Remove_ads.lpx → 待定：fmz 只有 Loon 版 WeChatMiniAds.plugin，无 Surge 版；功能与 240 重叠，建议并入 240 后删掉本条
- 270 Weixin_Official_Accounts_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partW/WeChatOfficialAccount.sgmodule
- 271 QQMusic_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partQ/QQMusic.sgmodule
- 272 BaiduNetDisk_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partB/BaiduNetdisk.sgmodule
- 273 IThome_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partI/ITHome.sgmodule
- 274 QiDian_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partQ/QiDianReading.sgmodule
- 275 Remove_ads_by_keli.lpx → 丢弃：合集与本次各 App 独立模块重复，且会与其他模块撞规则；逐项已覆盖
- 278 UmetripAds.sgmodule → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partH/HangLvZongHeng.sgmodule
- 288 FleaMarket_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partX/XianYu.sgmodule
- 289 ColorfulClouds_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/partC/CaiYunWeather.sgmodule
- 290 12306_remove_ads.lpx → https://cdn.jsdelivr.net/gh/fmz200/wool_scripts@main/Surge/module/split/part1/12306.sgmodule
- 291 DragonRead_remove_ads.lpx → 待定：kelee 403、镜像库无同名文件

## 6. B. 禁用清单（enabled=false 的 18 条）

- 214 OraySunlogin_remove_ads.lpx → 保持禁用。若要启用改用 fmz Oray.sgmodule（200 / 466B / [URL Rewrite 2]+[MITM 1]）
- 215 Sub-Store.lpx → 保持禁用。Surge 无等价物（Sub-Store 是 Loon/QX 端脚本+面板，Surge 用原生订阅/策略组）
- 219 Weixin_external_links_unlock.lpx → 保持禁用。若要启用改用 fmz WeChatUnlockLinkRestrict.sgmodule
- 231 ZhuanZhuan_remove_ads.lpx → 保持禁用。若要启用改用 fmz ZhuanZhuan.sgmodule
- 232 CosmosPodcast_remove_ads.lpx → 保持禁用。若要启用改用 fmz XiaoYuZhou.sgmodule（200 / 1271B）
- 234 JD_Price.lpx → 保持禁用。
- 237 hlwxx_remove_ads.plugin → 保持禁用。
- 246 jd_price2.plugin → 保持禁用。
- 276 QuickSearch.lpx → 保持禁用。若要启用改用 zqzess Qsearch.sgmodule
- 279 youtube_2.lpx → 保持禁用。（250 已覆盖）
- 280 iRingo.Maps.plugin → 保持禁用。
- 281 iRingo.Siri.plugin → 保持禁用。
- 282 iRingo.WeatherKit.plugin → 保持禁用。
- 283 heiliao.sgmodule → 保持禁用。（Loon 载入时仍报 2 条脚本无法解析）
- 284 BoxJs.lpx → 保持禁用。
- 285 keep.plugin → 保持禁用。
- 286 Switch_repository_source.lpx → 保持禁用。
- 287 Switch_github_mirror.lpx → 保持禁用。

## 7. C. MITM 汇总（所有将启用模块的 hostname 并集）

并集来自 §5 里将启用的 a/b/c 三类模块的 `hostname` 段，去重后 **160 个正向条目 + 6 个负向（- 前缀）条目**。负向条目是 GSF General.mac 声明的「不 MitM 也不应打断连接」白名单，合并时要保留，否则手机会被这些域名的 TLS 拦断。

```
119.29.29.98
119.29.29.99
3dd0be8a-54fe-43ff-a0e7-f670c4f20432.bspapp.com
4thdimension.top
a.jxjt888.top
acs.m.goofish.com
acs.m.taobao.com
ad.12306.cn
afd.baidu.com
amap-aos-info-nogw.amap.com
amdc-sibling.alipay.com.cn
amdc.alipay.com
amdc.m.taobao.com
api*.tuisong.baidu.com
api-access.pangolin-sdk-toutiao-b.com
api-access.pangolin-sdk-toutiao.com
api-access.pangolin-sdk-toutiao1.com
api-overmind.youdao.com
api.bilibili.com
api.blibee.com
api.bspapp.com
api.gotokeep.com
api.live.bilibili.com
api.m.jd.com
api.pinduoduo.com
api.yangkeduo.com
api.zhihu.com
app.bilibili.com
appcloud2.zhihu.com
awg.enmonster.com
b.tslt.xyz
baichuan.baidu.com
c.jxjt888.top
capi.douyucdn.cn
capi.lkcoffee.com
ccsp-egmas.sf-express.com
cdke.youdao.com
ci.rnote.com
ci.xiaohongshu.com
cn-acs.m.cainiao.com
common.diditaxi.com.cn
conf.diditaxi.com.cn
cover.baidu.com
ct.xiaojukeji.com
d.syshhc.top
daijia.kuaidadi.com
daoyu.sdo.com
*.ddly666.top
dict.youdao.com
dictvip-business.youdao.com
discardrp.umetrip.com
dns.jd.com
douyucdn.cn
dsp-impr2.youdao.com
dsp-x.jd.com
ecapi.lkcoffee.com
edith.rnote.com
edith.xiaohongshu.com
fbchina.flipchina.cn
fc-video.cdn.bcebos.com
fcvbjbcebos.baidu.com
freight.xiaojukeji.com
g-acs.m.goofish.com
g.syshhc.top
gjsx.vip
grpc.biliapi.net
guide-acs.m.taobao.com
gw.api.ddxq.mobi
gz.gongzijx.com
hd.xiaojukeji.com
hkj178.com
home.umetrip.com
*.httpdns.pro
i*.hdslb.com
img0*.luckincoffeecdn.com
impservice.dictapp.youdao.com
interface.music.163.com
interface3.music.163.com
interface9.music.163.com
ios.wps.cn
iosoi.cn
ipv4.music.163.com
*.iqiyi.com
issuecdn.baidupcs.com
jabi.coding.net
jt.jxjt888.top
kad.gotokeep.com
lf-cdn-tos.bytescm.com
line3-h5-mobile-api.biligame.com
link.zhihu.com
lysl2020.com
m*.amap.com
m-cloud.zhihu.com
m.baidu.com
m.lkcoffee.com
m.xgjyouhui.com
mage.if.qidian.com
magev6.if.qidian.com
maicai.api.ddxq.mobi
manga.bilibili.com
mobads.baidu.com
mobile-pic.cache.iciba.com
mobile.yangkeduo.com
mp.weixin.qq.com
music.y.qq.com
ndstatic.cdn.bcebos.com
oimage*.ydstatic.com
open.e.kuaishou.cn
optimus-ads.amap.com
oral.youdao.com
oss.umetrip.com
p1-lm.adukwai.com
pagead2.googlesyndication.com
pan.baidu.com
poplayer.template.alibaba.com
qidian.qpic.cn
qj.bpojie.com
rec.rnote.com
rec.xiaohongshu.com
res.xiaojukeji.com
rp.hpplay.cn
rr*.googlevideo.com
rtbapi.douyucdn.cn
sa*.tuisong.baidu.com
*.smkj33.top
so.rnote.com
so.xiaohongshu.com
sofire.baidu.com
startup.umetrip.com
static1.keepcdn.com
staticlive.douyucdn.cn
staticsns.cdn.bcebos.com
tan.ipnas.ltd
*.tslt.xyz
tvapp.guilaile.cn
ucmp.sf-express.com
update.pan.baidu.com
us.l.qq.com
user.api.ddxq.mobi
*.weibo.cn
*.weibo.com
weibo.com
wp3.lobdol.cn
www.baidu.com
www.bbkj.work
www.benbenfx.xyz
www.freeheikeji.cn
www.google.com*
www.i3zh.com
www.laoguikeji.cn
www.rnote.com
www.xiaohongshu.com
www.zhihu.com
wx.mygolbs.com
wx.wxqqurl.cn
x.com
xcx.xianbaow.com
y.gtimg.cn
youtubei.googleapis.com
zhuanlan.zhihu.com
```

负向条目（排在 `hostname =` 行里，同样要带上）：

```
-*.facebook.com
-*.instagram.com
-*.pstatp.com
-*.snssdk.com
-*.twitter.com
-i.vip.iqiyi.com
```

合并注意：

- `www.google.com*`、`*.iqiyi.com`、`*.httpdns.pro`、`*.weibo.cn`、`*.weibo.com`、`m*.amap.com`、`api*.tuisong.baidu.com` 等带通配符，Surge `[MITM]` 支持 `*` 前缀和 `?` 单字符，可直接粘贴。
- 60 个条目里有 25 个来自 ddgksf 系小程序的短链/推广域名（`*.jxjt888.top`、`*.smkj33.top`、`*.tslt.xyz` 等），它们在 #240 自建时会一起带进来；如果只想要 App 去广告、不做小程序，这 25 个可以删掉。
- `119.29.29.98` / `119.29.29.99` 是 HTTPDNS 服务器 IP（来自 GSF HTTPDNS.Block），不是域名，Surge 允许写进 hostname。

## 8. 落地顺序建议

1. 先装 5 个 a 类（`gsf/httpdns`、`gsf/dns`、`gsf/gmac`、`nobyda/captcha`、`zqzess/refix`）——这 5 个是引擎/基础设施，其它模块依赖 MITM 才生效。
2. 再装 b 类里你实际在 Mac 上用的 App 对应模块（推荐先`Baidu`、`Zhihu`、`bilibili`、`NetEaseCloudMusic`、`QQMusic`、`Google`、`YouTube`）。
3. 自建 3 条按 §4 抄，模板可直接用。
4. d 类 8 条与待定 6 条不进 Surge；待定项解锁后按 §4 补。
