// Loon 网络变化（network-changed）：记录 SSID/IP，变化时通知
var cfg = {};
try { cfg = JSON.parse($config.getConfig() || "{}"); } catch (e) {}
var ssid = cfg.ssid || "";
var digest = ssid;
var last = $persistentStore.read("loon_last_net") || "";
if (digest && digest !== last) {
  $persistentStore.write(digest, "loon_last_net");
  console.log("[网络事件] " + ssid);
  $notification.post("网络变化", ssid, "Loon 已重载分流");
} else {
  console.log("[网络事件] 无变化 " + ssid);
}
$done();
