// Loon AI 体检（cron）：内容级检测地区组是否真的能用于 ChatGPT / Gemini，再切 AI（select）组
var GROUP = "AI";
var CANDIDATES = ["美国", "日本", "新国", "台湾"];
var OPENAI = "https://api.openai.com/v1/models";
var GEMINI_WEB = "https://gemini.google.com/app";
var GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";
var GOOGLE = "https://www.google.com/search?q=test&hl=en";
var GOOGLE_BLOCK = ["unusual traffic", "detected unusual", "captcha", "/sorry/", "automated queries"];
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";
var KEY = "loon_ai_last_v5";
var HYSTERESIS = 1.3;
var BLOCK_MARKERS = ["not available in your country", "isn't available in your country", "is not available in your country", "unsupported region", "unusual traffic", "region is not supported"];
var API_REGION_BLOCK = ["User location is not supported", "location is not supported", "not supported for the API use"];
var results = [], pending = CANDIDATES.length;

function log(s) { console.log("[AI体检] " + s); }

function policyCfg() {
  try { return JSON.parse($config.getConfig() || "{}"); } catch (e) { return {}; }
}
function resolveGroup() {
  var groups = policyCfg().all_policy_groups || [];
  if (groups.indexOf(GROUP) >= 0) return GROUP;
  for (var i = 0; i < groups.length; i++) {
    var g = String(groups[i]);
    if (g.replace(/^[^A-Za-z]*/, "") === "AI") return g;
  }
  return GROUP;
}
function currentSelection(name) {
  var ps = policyCfg().policy_select || {};
  return ps[name] || "";
}
function get(policy, url, cb) {
  var t0 = Date.now();
  $httpClient.get({ url: url, node: policy, timeout: 10000, headers: { "User-Agent": UA } }, function (err, resp, data) {
    cb(!err && resp, resp ? resp.status : 0, String(data || ""), Date.now() - t0);
  });
}
function hasAny(body, arr) {
  for (var i = 0; i < arr.length; i++) if (body.indexOf(arr[i]) >= 0) return arr[i];
  return "";
}

var groupName = resolveGroup();
log("使用组名 " + groupName + "，当前 AI 选择=" + (currentSelection(groupName) || "未选"));

function checkOne(policy, cb) {
  var r = { policy: policy, ok: false, ms: 0, notes: [] };
  get(policy, OPENAI, function (ok, st, body, ms) {
    r.ms += ms;
    var openaiOk = ok && st === 401;
    r.notes.push("openai=" + (ok ? st : "ERR"));
    if (!openaiOk) return cb(r);
    get(policy, GEMINI_API, function (ok2, st2, body2, ms2) {
      r.ms += ms2;
      var blocked = hasAny(body2, API_REGION_BLOCK);
      var apiOk = ok2 && st2 === 403 && !blocked;
      r.notes.push("geminiApi=" + (ok2 ? st2 : "ERR") + (blocked ? "(region-block)" : ""));
      if (!apiOk) return cb(r);
      get(policy, GOOGLE, function (okg, stg, bodyg, msg) {
        r.ms += msg;
        var gm = hasAny(bodyg, GOOGLE_BLOCK);
        var googleOk = okg && stg === 200 && !gm;
        r.notes.push("google=" + (okg ? stg : "ERR") + (gm ? "(flag:" + gm + ")" : ""));
        if (!googleOk) return cb(r);
        get(policy, GEMINI_WEB, function (ok3, st3, body3, ms3) {
          r.ms += ms3;
          var m = hasAny(body3, BLOCK_MARKERS);
          var webOk = ok3 && st3 === 200 && body3.length > 20000 && !m;
          r.notes.push("geminiWeb=" + (ok3 ? st3 : "ERR") + "/" + body3.length + (m ? "(block:" + m + ")" : ""));
          r.ok = webOk;
          cb(r);
        });
      });
    });
  });
}

CANDIDATES.forEach(function (p) {
  checkOne(p, function (r) {
    results.push(r);
    log(p + " => " + (r.ok ? "OK " + r.ms + "ms" : "FAIL") + " [" + r.notes.join(", ") + "]");
    if (--pending === 0) decide();
  });
});

function decide() {
  var good = results.filter(function (r) { return r.ok; }).sort(function (a, b) { return a.ms - b.ms; });
  var current = currentSelection(groupName) || "";
  function record(action, chosen) {
    var actual = currentSelection(groupName) || "";
    $persistentStore.write(JSON.stringify({ time: new Date().toISOString(), action: action, current: current, chosen: chosen, actualAfter: actual, results: results }), KEY);
    log("记录：action=" + action + " chosen=" + chosen + " 实际选举=" + (actual || "未选"));
    $done();
  }
  if (good.length === 0) { log("全部不可用，保持 " + current); return record("none", current); }
  var best = good[0];
  var cur = good.filter(function (r) { return r.policy === current; })[0];
  if (cur && cur.ms <= best.ms * HYSTERESIS) { log("保持 " + current + " (" + cur.ms + "ms)"); return record("keep", current); }
  var okSet = false;
  try { okSet = $config.getConfig(groupName, best.policy) ? true : false; } catch (e) { okSet = false; }
  log("切换 " + (current || "-") + " -> " + best.policy + (okSet ? "" : " [设置失败]"));
  if (okSet) $notification.post("AI 解锁体检", "已切换", best.policy + " " + best.ms + "ms");
  record(okSet ? "switched" : "switch-failed", best.policy);
}
