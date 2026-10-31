// Surge SCRIPT 规则：计量网络（iPhone 热点 172.20.10.0/28 或指定 SSID）下，
// 未命中前面规则的流量改走 🪫 低倍节点；家里/有线网络不匹配，仍走 FINAL。
var METERED_SSIDS = ["Cooper 的 iPhone", "Cooper's iPhone", "iPhone"];
var n = $network || {};
var v4 = (n.v4 && n.v4.primaryAddress) || "";
var ssid = (n.wifi && n.wifi.ssid) || "";
var metered = v4.indexOf("172.20.10.") === 0 || METERED_SSIDS.indexOf(ssid) >= 0;
console.log("[SSID规则] ssid=" + ssid + " v4=" + v4 + " => matched=" + metered);
$done({ matched: metered });
