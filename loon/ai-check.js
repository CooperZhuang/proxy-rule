// Loon AI 巡检（cron）：监控各地区组对 ChatGPT / Gemini 的可用性；不切换策略（AI 组用 url-test 自维护）
var CANDIDATES = ["美国", "日本", "新国", "台湾"];
var OPENAI = "https://api.openai.com/v1/models";
var GEMINI_WEB = "https://gemini.google.com/app";
var GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";
var GOOGLE = "https://www.google.com/generate_204";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36";
var KEY = "loon_ai_monitor";
var BLOCK = ["not available in your country", "isn't available in your country", "unsupported region", "unusual traffic", "region is not supported"];
var results = [], pending = CANDIDATES.length, fails = 0;
function log(s) { console.log("[AI巡检] " + s); }
function hasAny(b, a) { for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) >= 0) return a[i]; return ""; }
function get(policy, url, cb) {
  var t0 = Date.now();
  $httpClient.get({ url: url, node: policy, timeout: 10000, headers: { "User-Agent": UA } }, function (e, r, d) {
    cb(!e && r, r ? r.status : 0, String(d || ""), Date.now() - t0);
  });
}
function check(policy, cb) {
  var r = { policy: policy, ok: false, ms: 0, notes: [] };
  get(policy, OPENAI, function (o, s, b, ms) {
    r.ms += ms; r.notes.push("openai=" + (o ? s : "ERR"));
    if (!(o && s === 401)) return cb(r);
    get(policy, GEMINI_API, function (o2, s2, b2, ms2) {
      r.ms += ms2; var blk = (b2.indexOf("User location is not supported") >= 0); r.notes.push("geminiApi=" + (o2 ? s2 : "ERR") + (blk ? "(region)" : ""));
      if (!(o2 && s2 === 403 && !blk)) return cb(r);
      get(policy, GEMINI_WEB, function (o3, s3, b3, ms3) {
        r.ms += ms3; var m = hasAny(b3, BLOCK);
        r.notes.push("geminiWeb=" + (o3 ? s3 : "ERR") + "/" + b3.length + (m ? "(block)" : ""));
        r.ok = !!(o3 && s3 === 200 && b3.length > 20000 && !m);
        cb(r);
      });
    });
  });
}
CANDIDATES.forEach(function (p) {
  check(p, function (r) {
    results.push(r);
    if (!r.ok) fails++;
    log(r.policy + " => " + (r.ok ? "OK " + r.ms + "ms" : "FAIL") + " [" + r.notes.join(", ") + "]");
    if (--pending === 0) done();
  });
});
function done() {
  $persistentStore.write(JSON.stringify({ time: new Date().toISOString(), results: results }), KEY);
  if (fails === CANDIDATES.length) {
    $notification.post("AI 巡检", "全部不可用", "ChatGPT/Gemini 四个地区组都没通过检测");
  } else if (fails > 0) {
    log("部分不可用: " + fails + "/" + CANDIDATES.length);
  }
  $done();
}
