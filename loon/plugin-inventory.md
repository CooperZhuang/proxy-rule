# Loon 插件清单（原 90 项）与保留建议

数据来源：`Configs/default.lcf`（优化前：90 项 = 75 启用 + 15 禁用）对比 `Configs/default-optimized.lcf`。

当前状态（2026-11-01 10:38 恢复 29 个推荐项后）：**45 启用** + **27 注释备选** + **18 已删除**。

- `主力(启用)`：当前生效；`备选(注释)`：配置里取消 # 即启用；`已删除`：需从 default.lcf 拷回
- 建议 `保留`：核心；`推荐恢复`：本轮已恢复；`按需`：用哪个 App 开哪个；`不建议`：重复/失效/干扰多端同步

## 一、当前启用（45）

| # | 插件 | 类型 | 建议 | 说明 | 位置 |
|---|---|---|---|---|---|
| 4 | GoogleCAPTCHA.sgmodule | 功能修复 | **保留** | 修 Google 人机验证频发 | optimized |
| 20 | ScriptHub.Loon.plugin | 脚本引擎 | **保留** | Script Hub 转换/转发脚本 | optimized |
| 21 | xiaohongshu.lpx | App 去广告 | **保留** | 小红书；不用小红书可关 | optimized |
| 46 | Sub-Store.lpx | 订阅工具 | **保留** | 订阅管理/转换，配合 resource-parser 使用 | optimized |
| 49 | ReFix.plugin | 重写引擎 | **保留** | 重写规则修复，建议常开 | optimized |
| 50 | General.plugin | 增强合集 | **保留** | GetSomeFries 通用增强（含部分 iRingo 能力） | optimized |
| 54 | AppleWeatherEnhancer.lpx | 功能增强 | **保留** | 苹果天气数据增强 | optimized |
| 58 | Weixin_external_links_unlock.lpx | 功能增强 | **保留** | 微信外链直接打开 | optimized |
| 59 | QQ_Redirect.lpx | 功能增强 | **保留** | QQ 内链接跳转修复 | optimized |
| 81 | BaiduSearchWebpage_remove_ads.lpx | App 去广告 | **保留** | 百度网页/搜索去广告 | optimized |
| 84 | LoonGallery.lpx | 工具 | **保留** | 插件/规则画廊 | optimized |
| 85 | Block_HTTPDNS.lpx | 拦截防护 | **保留** | 拦 HTTPDNS 绕过代理 | optimized |
| 86 | BlockAdvertisers.lpx | 拦截防护 | **保留** | 广告主域名拦截 | optimized |
| 89 | Prevent_DNS_Leaks.lpx | 拦截防护 | **保留** | 防 DNS 泄漏，TUN 模式建议常开 | optimized |
| 5 | DaMaiAds.sgmodule | App 去广告 | **推荐恢复** | 大麦 H5 | optimized |
| 8 | Weibo_remove_ads.lpx | App 去广告 | **推荐恢复** | 微博 | optimized |
| 11 | Amap_remove_ads.lpx | App 去广告 | **推荐恢复** | 高德地图 | optimized |
| 18 | Applet.sgmodule | App 去广告 | **推荐恢复** | 微信小程序通用去广告 | optimized |
| 19 | StartUpAds.sgmodule | App 去广告 | **推荐恢复** | 开屏广告（墨鱼） | optimized |
| 23 | Damai_remove_ads.lpx | App 去广告 | **推荐恢复** | 大麦 App | optimized |
| 26 | WPS_Documents_remove_ads.lpx | App 去广告 | **推荐恢复** | WPS | optimized |
| 27 | TXDocs_remove_ads.lpx | App 去广告 | **推荐恢复** | 腾讯文档 | optimized |
| 30 | PinDuoDuo_remove_ads.lpx | App 去广告 | **推荐恢复** | 拼多多 | optimized |
| 31 | SF-Express_remove_ads.lpx | App 去广告 | **推荐恢复** | 顺丰 | optimized |
| 38 | LuckinCoffee_remove_ads.lpx | App 去广告 | **推荐恢复** | 瑞幸 | optimized |
| 40 | YouTube_remove_ads.lpx | App 去广告 | **推荐恢复** | YouTube | optimized |
| 42 | Cainiao_remove_ads.lpx | App 去广告 | **推荐恢复** | 菜鸟 | optimized |
| 43 | Bilibili_remove_ads.lpx | App 去广告 | **推荐恢复** | 哔哩哔哩 | optimized |
| 44 | NeteaseCloudMusic_remove_ads.lpx | App 去广告 | **推荐恢复** | 网易云音乐 | optimized |
| 45 | Zhihu_remove_ads.lpx | App 去广告 | **推荐恢复** | 知乎 | optimized |
| 62 | YoudaoDict_remove_ads.lpx | App 去广告 | **推荐恢复** | 有道词典 | optimized |
| 64 | Douyu_remove_ads.lpx | App 去广告 | **推荐恢复** | 斗鱼 | optimized |
| 67 | XiaoHeiHe_remove_ads.lpx | App 去广告 | **推荐恢复** | 小黑盒 | optimized |
| 68 | DiDi_remove_ads.lpx | App 去广告 | **推荐恢复** | 滴滴出行 | optimized |
| 71 | Taobao_remove_ads.lpx | App 去广告 | **推荐恢复** | 淘宝 | optimized |
| 72 | JD_remove_ads.lpx | App 去广告 | **推荐恢复** | 京东 | optimized |
| 76 | iQiYi_Video_remove_ads.lpx | App 去广告 | **推荐恢复** | 爱奇艺 | optimized |
| 77 | WexinMiniPrograms_Remove_ads.lpx | App 去广告 | **推荐恢复** | 微信小程序广告 | optimized |
| 78 | Weixin_Official_Accounts_remove_ads.lpx | App 去广告 | **推荐恢复** | 微信公众号广告 | optimized |
| 79 | QQMusic_remove_ads.lpx | App 去广告 | **推荐恢复** | QQ 音乐 | optimized |
| 80 | BaiduNetDisk_remove_ads.lpx | App 去广告 | **推荐恢复** | 百度网盘 | optimized |
| 82 | IThome_remove_ads.lpx | App 去广告 | **推荐恢复** | IT之家 | optimized |
| 83 | QiDian_remove_ads.lpx | App 去广告 | **推荐恢复** | 起点读书 | optimized |
| 29 | OraySunlogin_remove_ads.lpx | App 去广告 | **按需** | 向日葵远程控制，用则留 | optimized |
| 90 | Node_detection_tool.lpx | 工具 | **按需** | 节点检测/测速，按需 | optimized |

## 二、备选注释（27）

| # | 插件 | 类型 | 建议 | 说明 | 位置 |
|---|---|---|---|---|---|
| 6 | ZhuanZhuan_remove_ads.lpx | App 去广告 | **按需** | 转转 | optimized |
| 7 | CosmosPodcast_remove_ads.lpx | App 去广告 | **按需** | 小宇宙播客 | optimized |
| 9 | JD_Price.lpx | 功能增强 | **按需** | 京东价格走势，依赖 BoxJs | optimized |
| 10 | HantingHotels_remove_ads.lpx | App 去广告 | **按需** | 汉庭/华住 | optimized |
| 12 | Dewu_remove_ads.lpx | 其他 | **按需** |  | optimized |
| 13 | XWebAds.plugin | App 去广告 | **按需** | 腾讯 X5 内核广告位 | optimized |
| 14 | TuhuAutoCare.lpx | App 去广告 | **按需** | 途虎养车 | optimized |
| 15 | hlwxx_remove_ads.plugin | App 去广告 | **按需** | 小众站点，自用再开 | optimized |
| 16 | javdbapp.ads.sgmodule | App 去广告 | **按需** | 成人站点，自用再开 | optimized |
| 17 | missav.ads.sgmodule | App 去广告 | **按需** | 成人站点，自用再开 | optimized |
| 22 | JiaXiaoDrive_remove_ads.lpx | App 去广告 | **按需** | 驾校一点通 | optimized |
| 24 | Weibo_intl_remove_ads.lpx | App 去广告 | **按需** | 微博国际版 | optimized |
| 25 | DingdongMaicai_remove_ads.lpx | App 去广告 | **按需** | 叮咚买菜 | optimized |
| 28 | jd_price2.plugin | 功能增强 | **按需** | 京东价格（新版），依赖 BoxJs | optimized |
| 32 | FC_Box_remove_ads.lpx | App 去广告 | **按需** | FC 盒子 | optimized |
| 39 | 51Job_remove_ads.lpx | 其他 | **按需** |  | optimized |
| 41 | RedPaper_remove_ads.lpx | App 去广告 | **按需** | 红板报 | optimized |
| 48 | Google.lpx | 功能增强 | **按需** | Google 搜索增强 | optimized |
| 55 | CaiYunAds.plugin | App 去广告 | **按需** | 彩云天气 | optimized |
| 56 | UnnooQuan_remove_watermark.lpx | 功能增强 | **按需** | 去水印 | optimized |
| 61 | Keep_remove_ads.lpx | 其他 | **按需** |  | optimized |
| 66 | BiliComic_remove_ads.lpx | App 去广告 | **按需** | B 站漫画 | optimized |
| 69 | SevenCat_remove_ads.lpx | App 去广告 | **按需** | 七猫小说 | optimized |
| 73 | Umetrip_remove_ads.lpx | App 去广告 | **按需** | 航旅纵横 | optimized |
| 74 | CaixinMedia_remove_ads.lpx | App 去广告 | **按需** | 财新 | optimized |
| 87 | Remove_ads_by_keli.lpx | App 去广告 | **按需** | 可莉去广告合集（覆盖杂项 App） | optimized |
| 88 | QuickSearch.lpx | 功能增强 | **按需** | 快捷搜索 | optimized |

## 三、已删除 / 原本禁用（18）

| # | 插件 | 类型 | 建议 | 说明 | 位置 |
|---|---|---|---|---|---|
| 2 | UmetripAds.sgmodule | App 去广告 | **按需** | 原配置 enabled=false；航旅纵横 H5 | default.lcf |
| 51 | BoxJs.lpx | 工具 | **按需** | 原配置 enabled=false；要用 BoxJs 面板/京东价格脚本才需要 | default.lcf |
| 53 | keep.plugin | App 去广告 | **按需** | 原配置 enabled=false；用 Keep 再开 | default.lcf |
| 63 | FleaMarket_remove_ads.lpx | App 去广告 | **按需** | 原配置 enabled=false；闲鱼 | default.lcf |
| 65 | ColorfulClouds_remove_ads.lpx | App 去广告 | **按需** | 原配置 enabled=false；彩云天气 | default.lcf |
| 70 | 12306_remove_ads.lpx | App 去广告 | **按需** | 原配置 enabled=false；12306 | default.lcf |
| 75 | DragonRead_remove_ads.lpx | App 去广告 | **按需** | 原配置 enabled=false；龙读 | default.lcf |
| 999 | blockAds.plugin | 其他 | **按需** |  | default.lcf |
| 3 | youtube_2.lpx | App 去广告 | **不建议** | 原配置 enabled=false；旧版，用 YouTube_remove_ads 即可 | default.lcf |
| 33 | iRingo.Location.plugin | 功能增强 | **不建议** | 原配置就 enabled=false；General.plugin 已含部分能力，需要再开 | default.lcf |
| 34 | iRingo.Maps.plugin | 功能增强 | **不建议** | 同上 | default.lcf |
| 35 | iRingo.Siri.plugin | 功能增强 | **不建议** | 同上 | default.lcf |
| 36 | iRingo.WeatherKit.plugin | 功能增强 | **不建议** | 同上；已有 AppleWeatherEnhancer | default.lcf |
| 37 | heiliao.sgmodule | App 去广告 | **不建议** | 启动即报脚本无法解析，上次排查时移除 | default.lcf |
| 47 | Script-Hub.lpx | 脚本引擎 | **不建议** | 与 ScriptHub.Loon.plugin 功能重复 | default.lcf |
| 52 | DNS.plugin | 拦截防护 | **不建议** | 原配置 enabled=false；已有 Block_HTTPDNS+Prevent_DNS_Leaks+加密 DNS | default.lcf |
| 57 | Switch_repository_source.lpx | 工具 | **不建议** | 原配置 enabled=false；会改订阅源，易与多端同步冲突 | default.lcf |
| 60 | Switch_github_mirror.lpx | 工具 | **不建议** | 原配置 enabled=false；会改下载镜像，排障时难定位 | default.lcf |

