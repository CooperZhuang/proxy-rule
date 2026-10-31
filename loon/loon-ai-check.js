// Loon AI 体检（cron）：内容级检测四个地区组，把 AI（select）切到可用节点
// 稳定优先：当前选择通过检测且不比最优慢太多时保持，避免来回切
var GROUP = "AI";
var CANDIDATES = ["美国节点", "日本节点", "新国节点", "台湾节点"];
var OPENAI = "https://api.openai.com/v1/models";
var GEMINI = "https://gemini.google.com/app";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";
var KEY = "loon_ai_last";
var HYSTERESIS = 1.3;
var results = [], pending = CANDIDATES.length;

function log(s) { console.log("[AI体检] " + s); }

function probe(policy, url, cb) {
  var t0 = Date.now();
  $httpClient.get({ url: url, node: policy, timeout: 8000, headers: { "User-Agent": UA } }, function (err, resp, data) {
    cb(!err && resp, resp ? resp.status : 0, String(data || ""), Date.now() - t0);
  });
}

function checkOne(policy, cb) {
  probe(policy, OPENAI, function (ok, status, body, ms) {
    var pass = ok && status === 401 && (body.indexOf("invalid_request_error") >= 0 || body.indexOf("Missing bearer") >= 0);
    if (!pass) return cb(false, ms, "openai=" + status);
    probe(policy, GEMINI, function (ok2, status2, body2, ms2) {
      var blocked = !ok2 || status2 !== 200 || body2.length < 20000 ||
        body2.indexOf("unusual traffic") >= 0 || body2.indexOf("\u5f02\u5e38\u6d41\u91cf") >= 0;
      cb(!blocked, ms + ms2, "gemini=" + status2 + "/" + body2.length);
    });
  });
}

CANDIDATES.forEach(function (p) {
  checkOne(p, function (ok, ms, note) {
    results.push({ policy: p, ok: ok, ms: ms, note: note });
    log(p + " => " + (ok ? "OK " + ms + "ms" : "FAIL " + note));
    if (--pending === 0) decide();
  });
});

function decide() {
  var good = results.filter(function (r) { return r.ok; }).sort(function (a, b) { return a.ms - b.ms; });
  var current = "";
  try { current = $config.getSelectedPolicy(GROUP) || ""; } catch (e) {}
  var record = function (action, chosen) {
    $persistentStore.write(JSON.stringify({ time: new Date().toISOString(), action: action, current: current, chosen: chosen, results: results }), KEY);
    $done();
  };
  if (good.length === 0) {
    log("全部不可用，保持 " + current);
    return record("none-available", current);
  }
  var best = good[0];
  var currentOk = good.filter(function (r) { return r.policy === current; })[0];
  if (currentOk && currentOk.ms <= best.ms * HYSTERESIS) {
    log("保持 " + current + "（" + currentOk.ms + "ms，最优 " + best.policy + " " + best.ms + "ms）");
    return record("keep", current);
  }
  var okSet = false;
  try { okSet = $config.getConfig(GROUP, best.policy) ? true : false; } catch (e) { okSet = false; }
  log("切换 " + current + " -> " + best.policy + (okSet ? "" : " [设置失败]"));
  if (okSet) $notification.post("AI 解锁体检", "已切换", best.policy + " " + best.ms + "ms");
  record(okSet ? "switched" : "switch-failed", best.policy);
}
