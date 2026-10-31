// Loon AI 体检（cron）：内容级检测四个地区组，把 AI（select）切到可用节点
var GROUP = "AI";
var CANDIDATES = ["美国节点", "日本节点", "新国节点", "台湾节点"];
var OPENAI = "https://api.openai.com/v1/models";
var GEMINI = "https://gemini.google.com/app";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";
var KEY = "loon_ai_last_v3";
var HYSTERESIS = 1.3;
var results = [], pending = CANDIDATES.length;

function log(s) { console.log("[AI体检] " + s); }

function resolveGroup() {
  try {
    var cfg = JSON.parse($config.getConfig() || "{}");
    var groups = cfg.all_policy_groups || [];
    if (groups.indexOf(GROUP) >= 0) return GROUP;
    for (var i = 0; i < groups.length; i++) {
      if (String(groups[i]).replace(/^[^AIa-z]*/g, "") === "AI") return groups[i];
    }
    return GROUPS_FALLBACK(groups);
  } catch (e) { return GROUP; }
}
function GROUPS_FALLBACK(groups) { return groups && groups.length ? "AI" : "AI"; }

function currentSelection(name) {
  try {
    var cfg = JSON.parse($config.getConfig() || "{}");
    return (cfg.policy_select && cfg.policy_select[name]) || "";
  } catch (e) { return ""; }
}

function probe(policy, url, cb) {
  var t0 = Date.now();
  $httpClient.get({ url: url, node: policy, timeout: 8000, headers: { "User-Agent": UA } }, function (err, resp, data) {
    cb(!err && resp, resp ? resp.status : 0, Date.now() - t0);
  });
}

function checkOne(policy, cb) {
  probe(policy, OPENAI, function (ok, status, ms) {
    var pass = ok && status === 401;
    if (!pass) return cb(false, ms, "openai=" + status);
    probe(policy, GEMINI, function (ok2, status2, ms2) {
      cb(!!ok2 && status2 === 200, ms + ms2, "gemini=" + status2);
    });
  });
}

var groupName = resolveGroup();
log("使用组名 " + groupName);

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
  try {
    var prev = JSON.parse($persistentStore.read(KEY) || "{}");
    if (prev && prev.chosen) current = prev.chosen;
  } catch (e) {}
  if (!current) current = currentSelection(groupName);
  var record = function (action, chosen) {
    $persistentStore.write(JSON.stringify({ time: new Date().toISOString(), action: action, current: current, chosen: chosen, results: results }), KEY);
    $done();
  };
  if (good.length === 0) { log("全部不可用，保持 " + current); return record("none-available", current); }
  var best = good[0];
  var curOk = good.filter(function (r) { return r.policy === current; })[0];
  if (curOk && curOk.ms <= best.ms * HYSTERESIS) {
    log("保持 " + current + "（" + curOk.ms + "ms，最优 " + best.policy + " " + best.ms + "ms）");
    return record("keep", current);
  }
  var okSet = false;
  try { okSet = $config.getConfig(groupName, best.policy) ? true : false; } catch (e) { okSet = false; }
  log("切换 " + (current || "-") + " -> " + best.policy + (okSet ? "" : " [设置失败]"));
  if (okSet) $notification.post("AI 解锁体检", "已切换", best.policy + " " + best.ms + "ms");
  record(okSet ? "switched" : "switch-failed", best.policy);
}
