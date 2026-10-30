// AI 解锁体检（Surge cron 脚本，节点级）
// 组：AI = select, include-all-proxies=1, policy-regex-filter=<美/日/新/台节点>
// 逻辑：内容级检测（不信状态码 200）→ 当前节点通过就保持不动（稳定优先）→ 只在失败时换节点
// 触发：profile [Script] 里 ai-unlock-check = type=cron

var GROUP = "AI";
var OPENAI_URL = "https://api.openai.com/v1/models";
var GEMINI_URL = "https://gemini.google.com/app";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var BATCH = 6;          // 每批并发探测数
var MAX_SCAN = 60;      // 一次体检最多探测多少个候选节点
var WANT_PASS = 6;      // 收集到多少个 OpenAI 通过的就提前结束扫描
var STORE_KEY = "ai_verify_last";
var CN_ANOMALY = "\u5f02\u5e38\u6d41\u91cf"; // 异常流量

function details() { try { return $surge.selectGroupDetails() || {}; } catch (e) { return {}; } }
function members() { var d = details(); return (d.groups && d.groups[GROUP]) || []; }
function current() { var d = details(); return (d.decisions && d.decisions[GROUP]) || ""; }

function fetch(url, policy, cb) {
  var t0 = Date.now();
  $httpClient.get({ url: url, policy: policy, timeout: 8, headers: { "User-Agent": UA } },
    function (e, r, d) { cb(e, (r && r.status) || 0, d ? String(d) : "", Date.now() - t0); });
}

// OpenAI：401 + invalid_api_key = 线路可达；403/unsupported_country = 地区封
function checkOpenAI(policy, cb) {
  fetch(OPENAI_URL, policy, function (e, code, body, ms) {
    if (e) return cb(false, ms, "err");
    // 通：401 + invalid_request_error / Missing bearer / API key 提示（说明请求已到达 OpenAI）
    if (code === 401 && (body.indexOf("invalid_request_error") >= 0 || body.indexOf("Missing bearer") >= 0 || body.indexOf("API key") >= 0)) return cb(true, ms, "401");
    if (code === 403) return cb(false, ms, "403-blocked");
    return cb(false, ms, "code=" + code + ",len=" + body.length);
  });
}

// Gemini：200 + 正常页面 = 通过；429/短页/unusual traffic = 被风控
function checkGemini(policy, cb) {
  fetch(GEMINI_URL, policy, function (e, code, body, ms) {
    if (e) return cb(false, ms, "err");
    var blocked = code !== 200 || body.length < 20000 ||
      body.indexOf("unusual traffic") >= 0 || body.indexOf(CN_ANOMALY) >= 0;
    return cb(!blocked, ms, blocked ? ("code=" + code + ",len=" + body.length) : ("200/" + body.length));
  });
}

function both(policy, cb) {
  checkOpenAI(policy, function (ok1, ms1, n1) {
    if (!ok1) return cb(false, ms1 + 99999, "openai:" + n1);
    checkGemini(policy, function (ok2, ms2, n2) {
      cb(ok2, ms1 + ms2, "openai:" + n1 + " gemini:" + n2);
    });
  });
}

function finish(policy, action, note) {
  var rec = { time: new Date().toISOString(), action: action, policy: policy, note: note };
  $persistentStore.write(JSON.stringify(rec), STORE_KEY);
  $surge.logbook("[AI体检] " + action + " " + policy + " | " + note);
  $done();
}

function scan(cands, idx, passing) {
  if (idx >= cands.length || passing.length >= WANT_PASS || idx >= MAX_SCAN) return pickGemini(passing);
  var batch = cands.slice(idx, idx + BATCH);
  var left = batch.length;
  batch.forEach(function (p) {
    checkOpenAI(p, function (ok, ms, note) {
      if (ok) passing.push({ policy: p, ms: ms, note: note });
      if (--left === 0) scan(cands, idx + BATCH, passing);
    });
  });
}

function pickGemini(passing) {
  if (passing.length === 0) {
    $notification.post("AI 解锁体检", "无可用节点", "候选 " + members().length + " 个均未通过 OpenAI 检测");
    return finish(current(), "none-available", "all candidates failed openai check");
  }
  passing.sort(function (a, b) { return a.ms - b.ms; });
  var top = passing.slice(0, 5);
  var i = 0;
  (function next() {
    if (i >= top.length) {
      // 没有 Gemini 也通过的，退而求其次用最快 OpenAI 可用节点
      var best = top[0];
      var okSet = $surge.setSelectGroupPolicy(GROUP, best.policy);
      $notification.post("AI 解锁体检", "已切换（Gemini 未验证）", best.policy);
      return finish(best.policy, okSet ? "switched-no-gemini" : "switch-failed", "openai=" + best.ms + "ms; " + top.map(function (x) { return x.policy; }).join(" / "));
    }
    var cand = top[i++];
    checkGemini(cand.policy, function (ok, ms, note) {
      if (!ok) return next();
      var okSet = true;
      if (cand.policy !== cur) okSet = $surge.setSelectGroupPolicy(GROUP, cand.policy);
      if (cand.policy !== cur) $notification.post("AI 解锁体检", okSet ? "已切换" : "切换失败", cand.policy);
      finish(cand.policy, (cand.policy !== cur) ? (okSet ? "switched" : "switch-failed") : "keep", "openai=" + cand.ms + "ms gemini=" + note);
    });
  })();
}

// ---- 主流程 ----
var all = members();
if (all.length === 0) { finish("", "no-group", "AI 组成员为空"); }
else {
  var cur = current();
  if (cur && all.indexOf(cur) >= 0) {
    // 稳定优先：当前节点通过就保持，不因“别人更快”而切换，避免出口 IP 变化触发风控
    both(cur, function (ok, ms, note) {
      if (ok) return finish(cur, "keep", note);
      // 偶发超时/抖动：重试一次再决定
      setTimeout(function () {
        both(cur, function (ok2, ms2, note2) {
          if (ok2) return finish(cur, "keep-retry", note2);
          scan(all, 0, []);
        });
      }, 500);
    });
  } else {
    scan(all, 0, []);
  }
}
