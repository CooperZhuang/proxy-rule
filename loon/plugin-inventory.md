# Loon 插件现状（2026-11-01 10:50 载入后）

配置：`Configs/default-optimized.lcf`（已与隧道实际载入的 `config/.tunnelConf/default.lcf` 一致）

载入统计：**Load 42690 rules. 160 scripts. 1028 rewrites.**（上一版 42613/119/849；本轮用户启用后 +77 规则 +41 脚本 +179 重写）

插件：**67 启用 / 11 禁用 / 12 已从配置移除**（原 90 项）

已知异常：插件 `heiliao.sgmodule` 载入时报「存在 2 条异常脚本配置无法解析」。

## 一、启用（67）

| # | 插件 | 类型 | 建议 | 说明 |
|---|---|---|---|---|
| 4 | GoogleCAPTCHA.sgmodule | 功能修复 | 保留 | 修 Google 人机验证频发 |
| 20 | ScriptHub.Loon.plugin | 脚本引擎 | 保留 | Script Hub 转换/转发脚本 |
| 21 | xiaohongshu.lpx | App 去广告 | 保留 | 小红书；不用小红书可关 |
| 46 | Sub-Store.lpx | 订阅工具 | 保留 | 订阅管理/转换，配合 resource-parser 使用 |
| 49 | ReFix.plugin | 重写引擎 | 保留 | 重写规则修复，建议常开 |
| 50 | General.plugin | 增强合集 | 保留 | GetSomeFries 通用增强（含部分 iRingo 能力） |
| 54 | AppleWeatherEnhancer.lpx | 功能增强 | 保留 | 苹果天气数据增强 |
| 58 | Weixin_external_links_unlock.lpx | 功能增强 | 保留 | 微信外链直接打开 |
| 59 | QQ_Redirect.lpx | 功能增强 | 保留 | QQ 内链接跳转修复 |
| 81 | BaiduSearchWebpage_remove_ads.lpx | App 去广告 | 保留 | 百度网页/搜索去广告 |
| 84 | LoonGallery.lpx | 工具 | 保留 | 插件/规则画廊 |
| 85 | Block_HTTPDNS.lpx | 拦截防护 | 保留 | 拦 HTTPDNS 绕过代理 |
| 86 | BlockAdvertisers.lpx | 拦截防护 | 保留 | 广告主域名拦截 |
| 89 | Prevent_DNS_Leaks.lpx | 拦截防护 | 保留 | 防 DNS 泄漏，TUN 模式建议常开 |
| 5 | DaMaiAds.sgmodule | App 去广告 | 推荐恢复 | 大麦 H5 |
| 8 | Weibo_remove_ads.lpx | App 去广告 | 推荐恢复 | 微博 |
| 11 | Amap_remove_ads.lpx | App 去广告 | 推荐恢复 | 高德地图 |
| 18 | Applet.sgmodule | App 去广告 | 推荐恢复 | 微信小程序通用去广告 |
| 19 | StartUpAds.sgmodule | App 去广告 | 推荐恢复 | 开屏广告（墨鱼） |
| 23 | Damai_remove_ads.lpx | App 去广告 | 推荐恢复 | 大麦 App |
| 26 | WPS_Documents_remove_ads.lpx | App 去广告 | 推荐恢复 | WPS |
| 27 | TXDocs_remove_ads.lpx | App 去广告 | 推荐恢复 | 腾讯文档 |
| 30 | PinDuoDuo_remove_ads.lpx | App 去广告 | 推荐恢复 | 拼多多 |
| 31 | SF-Express_remove_ads.lpx | App 去广告 | 推荐恢复 | 顺丰 |
| 38 | LuckinCoffee_remove_ads.lpx | App 去广告 | 推荐恢复 | 瑞幸 |
| 40 | YouTube_remove_ads.lpx | App 去广告 | 推荐恢复 | YouTube |
| 42 | Cainiao_remove_ads.lpx | App 去广告 | 推荐恢复 | 菜鸟 |
| 43 | Bilibili_remove_ads.lpx | App 去广告 | 推荐恢复 | 哔哩哔哩 |
| 44 | NeteaseCloudMusic_remove_ads.lpx | App 去广告 | 推荐恢复 | 网易云音乐 |
| 45 | Zhihu_remove_ads.lpx | App 去广告 | 推荐恢复 | 知乎 |
| 62 | YoudaoDict_remove_ads.lpx | App 去广告 | 推荐恢复 | 有道词典 |
| 64 | Douyu_remove_ads.lpx | App 去广告 | 推荐恢复 | 斗鱼 |
| 67 | XiaoHeiHe_remove_ads.lpx | App 去广告 | 推荐恢复 | 小黑盒 |
| 68 | DiDi_remove_ads.lpx | App 去广告 | 推荐恢复 | 滴滴出行 |
| 71 | Taobao_remove_ads.lpx | App 去广告 | 推荐恢复 | 淘宝 |
| 72 | JD_remove_ads.lpx | App 去广告 | 推荐恢复 | 京东 |
| 76 | iQiYi_Video_remove_ads.lpx | App 去广告 | 推荐恢复 | 爱奇艺 |
| 77 | WexinMiniPrograms_Remove_ads.lpx | App 去广告 | 推荐恢复 | 微信小程序广告 |
| 78 | Weixin_Official_Accounts_remove_ads.lpx | App 去广告 | 推荐恢复 | 微信公众号广告 |
| 79 | QQMusic_remove_ads.lpx | App 去广告 | 推荐恢复 | QQ 音乐 |
| 80 | BaiduNetDisk_remove_ads.lpx | App 去广告 | 推荐恢复 | 百度网盘 |
| 82 | IThome_remove_ads.lpx | App 去广告 | 推荐恢复 | IT之家 |
| 83 | QiDian_remove_ads.lpx | App 去广告 | 推荐恢复 | 起点读书 |
| 2 | UmetripAds.sgmodule | App 去广告 | 按需 | 原配置 enabled=false；航旅纵横 H5 |
| 9 | JD_Price.lpx | 功能增强 | 按需 | 京东价格走势，依赖 BoxJs |
| 13 | XWebAds.plugin | App 去广告 | 按需 | 腾讯 X5 内核广告位 |
| 16 | javdbapp.ads.sgmodule | App 去广告 | 按需 | 成人站点，自用再开 |
| 17 | missav.ads.sgmodule | App 去广告 | 按需 | 成人站点，自用再开 |
| 25 | DingdongMaicai_remove_ads.lpx | App 去广告 | 按需 | 叮咚买菜 |
| 29 | OraySunlogin_remove_ads.lpx | App 去广告 | 按需 | 向日葵远程控制，用则留 |
| 41 | RedPaper_remove_ads.lpx | App 去广告 | 按需 | 红板报 |
| 48 | Google.lpx | 功能增强 | 按需 | Google 搜索增强 |
| 55 | CaiYunAds.plugin | App 去广告 | 按需 | 彩云天气 |
| 61 | Keep_remove_ads.lpx | 其他 | 按需 |  |
| 63 | FleaMarket_remove_ads.lpx | App 去广告 | 按需 | 原配置 enabled=false；闲鱼 |
| 65 | ColorfulClouds_remove_ads.lpx | App 去广告 | 按需 | 原配置 enabled=false；彩云天气 |
| 66 | BiliComic_remove_ads.lpx | App 去广告 | 按需 | B 站漫画 |
| 69 | SevenCat_remove_ads.lpx | App 去广告 | 按需 | 七猫小说 |
| 70 | 12306_remove_ads.lpx | App 去广告 | 按需 | 原配置 enabled=false；12306 |
| 73 | Umetrip_remove_ads.lpx | App 去广告 | 按需 | 航旅纵横 |
| 75 | DragonRead_remove_ads.lpx | App 去广告 | 按需 | 原配置 enabled=false；龙读 |
| 87 | Remove_ads_by_keli.lpx | App 去广告 | 按需 | 可莉去广告合集（覆盖杂项 App） |
| 90 | Node_detection_tool.lpx | 工具 | 按需 | 节点检测/测速，按需 |
| 3 | youtube_2.lpx | App 去广告 | 不建议 | 原配置 enabled=false；旧版，用 YouTube_remove_ads 即可 |
| 34 | iRingo.Maps.plugin | 功能增强 | 不建议 | 同上 |
| 36 | iRingo.WeatherKit.plugin | 功能增强 | 不建议 | 同上；已有 AppleWeatherEnhancer |
| 37 | heiliao.sgmodule | App 去广告 | 不建议 | 启动即报脚本无法解析，上次排查时移除 |

## 二、禁用（11）

| # | 插件 | 类型 | 建议 | 说明 |
|---|---|---|---|---|
| 6 | ZhuanZhuan_remove_ads.lpx | App 去广告 | 按需 | 转转 |
| 7 | CosmosPodcast_remove_ads.lpx | App 去广告 | 按需 | 小宇宙播客 |
| 15 | hlwxx_remove_ads.plugin | App 去广告 | 按需 | 小众站点，自用再开 |
| 28 | jd_price2.plugin | 功能增强 | 按需 | 京东价格（新版），依赖 BoxJs |
| 51 | BoxJs.lpx | 工具 | 按需 | 原配置 enabled=false；要用 BoxJs 面板/京东价格脚本才需要 |
| 53 | keep.plugin | App 去广告 | 按需 | 原配置 enabled=false；用 Keep 再开 |
| 88 | QuickSearch.lpx | 功能增强 | 按需 | 快捷搜索 |
| 35 | iRingo.Siri.plugin | 功能增强 | 不建议 | 同上 |
| 52 | DNS.plugin | 拦截防护 | 不建议 | 原配置 enabled=false；已有 Block_HTTPDNS+Prevent_DNS_Leaks+加密 DNS |
| 57 | Switch_repository_source.lpx | 工具 | 不建议 | 原配置 enabled=false；会改订阅源，易与多端同步冲突 |
| 60 | Switch_github_mirror.lpx | 工具 | 不建议 | 原配置 enabled=false；会改下载镜像，排障时难定位 |

## 三、已从配置移除（12）

| # | 插件 | 类型 | 建议 | 说明 |
|---|---|---|---|---|
| 10 | HantingHotels_remove_ads.lpx | App 去广告 | 按需 | 汉庭/华住 |
| 12 | Dewu_remove_ads.lpx | 其他 | 按需 |  |
| 14 | TuhuAutoCare.lpx | App 去广告 | 按需 | 途虎养车 |
| 22 | JiaXiaoDrive_remove_ads.lpx | App 去广告 | 按需 | 驾校一点通 |
| 24 | Weibo_intl_remove_ads.lpx | App 去广告 | 按需 | 微博国际版 |
| 32 | FC_Box_remove_ads.lpx | App 去广告 | 按需 | FC 盒子 |
| 39 | 51Job_remove_ads.lpx | 其他 | 按需 |  |
| 56 | UnnooQuan_remove_watermark.lpx | 功能增强 | 按需 | 去水印 |
| 74 | CaixinMedia_remove_ads.lpx | App 去广告 | 按需 | 财新 |
| 33 | iRingo.Location.plugin | 功能增强 | 不建议 | 原配置就 enabled=false；General.plugin 已含部分能力，需要再开 |
| 47 | Script-Hub.lpx | 脚本引擎 | 不建议 | 与 ScriptHub.Loon.plugin 功能重复 |
| 999 | blockAds.plugin | 其他 | 已禁用 | 按用户要求停用（原来覆盖 730+ App、规则最多） |

## 待处理

1. `heiliao.sgmodule`：载入报错，建议禁用（原来启动即报脚本无法解析）
2. `youtube_2.lpx` 与 `YouTube_remove_ads.lpx` 同时启用，YouTube 处理重复，建议只留后者
3. `JD_Price.lpx` 启用但 `BoxJs.lpx` 禁用、`jd_price2.plugin` 禁用：价格功能不完整，要么开 BoxJs 要么关 JD_Price
4. iRingo 只启用了 Maps/WeatherKit，Location 被移除、Siri 禁用：WeatherKit 与 `AppleWeatherEnhancer` 可能重复改天气接口；Maps 通常依赖 Location，建议补齐或只留一个天气类
5. `Umetrip_remove_ads.lpx` 与 `UmetripAds.sgmodule` 同时启用，航旅纵横 App/H5 两层，可只留一个
6. 广谱插件（javdbapp、missav、XWebAds、Remove_ads_by_keli）让 MITM 域名升到约 718 个，是开销/崩溃暴露面主要来源，想降压优先关这些
