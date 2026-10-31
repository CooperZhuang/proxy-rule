// Surge 事件脚本：网络变化 / 引擎启动 / 配置重载时记录网络状态并提示
var n = $network || {};
var w = (n.wifi && n.wifi.ssid) || "未连接";
var v4 = (n.v4 && n.v4.primaryAddress) || "-";
var metered = v4.indexOf("172.20.10.") === 0;
var digest = (v4 === "-" ? "无网络" : (metered ? "热点" : "常规")) + " | " + w + " | " + v4;
var last = $persistentStore.read("last_network_digest") || "";
if (digest === last) {
  $surge.logbook("[网络事件] 无变化: " + digest);
  $done();
} else {
  $persistentStore.write(digest, "last_network_digest");
  $surge.logbook("[网络事件] " + $script.name + " -> " + digest);
  $notification.post("网络变化", metered ? "iPhone 热点" : "常规网络", w + " " + v4);
  $done();
}
