// AI 节点解锁体检（Surge cron 脚本）
// 定时按策略探测 AI 站点，把 select 组 AI 切到真正可用的地区组；结果写入 persistentStore 方便查看。
// 依赖：profile 里 AI 必须是 select 组，成员包含下面 GROUPS 里的策略名。
// 触发：profile [Script] 里声明 type=cron,cronexp="*/30 * * * *"

var GROUPS = ["🇺🇸 美国节点", "🇯🇵 日本节点", "🇸🇬 新加坡节点", "🇨🇳 台湾节点"];
var PROBE = "https://chatgpt.com/robots.txt";        // ChatGPT：硬性条件
var PROBE2 = "https://gemini.google.com/robots.txt"; // Gemini：参考项
var TIMEOUT = 10;
var STORE_KEY = "ai_unlock_last";

function req(policy, url, cb) {
  var t0 = Date.now();
  $httpClient.get({
    url: url, policy: policy, timeout: TIMEOUT,
    headers: { "User-Agent": "Mozilla/5.0 (Surge AI unlock check)" }
  }, function (error, response) {
    var code = (response && response.status) || 0;
    cb(!error && (code === 200 || code === 204), code, Date.now() - t0);
  });
}

var results = [];
var pending = GROUPS.length;

GROUPS.forEach(function (g) {
  req(g, PROBE, function (ok, code, ms) {
    if (!ok) {
      results.push({ policy: g, ok: false, ms: ms, note: "chatgpt=" + code });
      if (--pending === 0) decide();
      return;
    }
    req(g, PROBE2, function (ok2, code2) {
      results.push({ policy: g, ok: true, ms: ms, note: "chatgpt=200/" + ms + "ms gemini=" + code2 });
      if (--pending === 0) decide();
    });
  });
});

function decide() {
  var good = results.filter(function (r) { return r.ok; });
  good.sort(function (a, b) { return a.ms - b.ms; });
  var cur = "";
  try { cur = $surge.selectGroupDetails().decisions["AI"] || ""; } catch (e) {}
  var summary = results.map(function (r) {
    return r.policy.replace(/节点|🇺🇸|🇯🇵|🇸🇬|🇨🇳/g, "") + (r.ok ? "=" + r.ms + "ms" : "=✗");
  }).join(" ");
  var ts = new Date().toISOString();
  var chosen = cur;
  var action = "keep";

  if (good.length === 0) {
    action = "none-available";
    $surge.logbook("[AI体检] 全部不可用，保持 " + cur + " | " + summary);
    $notification.post("AI 解锁体检", "全部不可用", "保持当前: " + cur);
  } else if (good[0].policy === cur) {
    $surge.logbook("[AI体检] 保持 " + cur + "（" + good[0].ms + "ms）| " + summary);
  } else {
    chosen = good[0].policy;
    var okSet = $surge.setSelectGroupPolicy("AI", chosen);
    action = okSet ? "switched" : "switch-failed";
    $surge.logbook("[AI体检] 切换 " + cur + " -> " + chosen + "（" + good[0].ms + "ms）| " + summary);
    if (okSet) $notification.post("AI 解锁体检", "已切换", chosen + " " + good[0].ms + "ms");
  }

  var record = { time: ts, action: action, current: cur, chosen: chosen,
                 results: results.map(function (r) { return r.policy + " " + r.note; }) };
  $persistentStore.write(JSON.stringify(record), STORE_KEY);
  console.log("[AI体检] " + JSON.stringify(record));
  $done();
}
