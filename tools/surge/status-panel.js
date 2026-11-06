// Surge 信息面板（generic script）：AI 组状态 / 网络 / 关键组出口
var STORE_KEY = "ai_verify_last";

function readStore() {
  try { var raw = $persistentStore.read(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

function aiPanel() {
  var lines = [];
  try {
    var d = $surge.selectGroupDetails();
    lines.push("当前节点: " + ((d.decisions && d.decisions["🤖 AI"]) || "未选择"));
    lines.push("候选节点: " + (((d.groups && d.groups["🤖 AI"]) || []).length) + " 个");
  } catch (e) { lines.push("组状态读取失败"); }
  var last = readStore();
  if (last) {
    lines.push("上次: " + last.action + " " + String(last.policy || "").replace(/\[.*$/, ""));
    lines.push(String(last.time).replace("T", " ").slice(0, 16));
  } else { lines.push("上次: 无记录"); }
  return { title: "AI 体检", content: lines.join("\n"), style: "info" };
}

function netPanel() {
  var n = $network || {};
  var w = (n.wifi && n.wifi.ssid) || "未连接";
  var v4 = (n.v4 && n.v4.primaryAddress) || "-";
  var lines = ["Wi-Fi: " + w, "内网 IP: " + v4, (v4.indexOf("172.20.10.") === 0 ? "网络: iPhone 热点（省流）" : "网络: 常规")];
  try {
    var d = $surge.selectGroupDetails();
    var decisions = d.decisions || {};
    ["🤖 AI", "💼 Teams", "🐟 兜底", "⬇️ 下载", "🇭🇰 香港", "🇯🇵 日本", "🇺🇸 美国"].forEach(function (k) {
      if (decisions[k]) lines.push(k + ": " + decisions[k]);
    });
  } catch (e) {}
  return { title: "网络 / 出口", content: lines.join("\n"), style: "info" };
}

var name = ($input && $input.panelName) || "";
var out = name.indexOf("AI") >= 0 ? aiPanel() : netPanel();
console.log("[面板] " + name + " => " + out.content.replace(/\n/g, " | "));
$done(out);
