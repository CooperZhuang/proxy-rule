// AI 解锁体检（Surge cron 脚本，节点级）
// 组：🤖 AI = select, include-all-proxies=1, policy-regex-filter=<美/日/新/台节点>
// 逻辑：内容级检测 → 当前节点通过就保持（稳定优先）→ 只在失败时换节点
// 网络未就绪（睡眠唤醒、Wi-Fi 未关联）时不误判：跳过或 15s 后重试一次

var GROUP = "🤖 AI";
var OPENAI_URL = "https://api.openai.com/v1/models";
var GEMINI_URL = "https://gemini.google.com/app";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var BATCH = 6;
var MAX_SCAN = 24;
var WANT_PASS = 4;
var STORE_KEY = "ai_verify_last";
var CN_ANOMALY = "\u5f02\u5e38\u6d41\u91cf";
var netErrors = 0;
var retried = false;

function details() { try { return $surge.selectGroupDetails() || {}; } catch (e) { return {}; } }
function members() { var d = details(); return (d.groups && d.groups[GROUP]) || []; }
function current() { var d = details(); return (d.decisions && d.decisions[GROUP]) || ""; }

function fetch(url, policy, cb) {
  var t0 = Date.now();
  $httpClient.get({ url: url, policy: policy, timeout: 6, headers: { "User-Agent": UA } },
    function (e, r, d) { cb(e, (r && r.status) || 0, d ? String(d) : "", Date.now() - t0); });
}

function checkOpenAI(policy, cb) {
  fetch(OPENAI_URL, policy, function (e, code, body, ms) {
    if (e) return cb(false, ms, "err");
    if (code === 401 && (body.indexOf("invalid_request_error") >= 0 || body.indexOf("Missing bearer") >= 0)) return cb(true, ms, "401");
    if (code === 403) return cb(false, ms, "403-blocked");
    return cb(false, ms, "code=" + code + ",len=" + body.length);
  });
}

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
    if (!ok1) return cb(false, "openai:" + n1);
    checkGemini(policy, function (ok2, ms2, n2) { cb(ok2, "openai:" + n1 + " gemini:" + n2); });
  });
}

function finish(policy, action, note) {
  $persistentStore.write(JSON.stringify({ time: new Date().toISOString(), action: action, policy: policy, note: note }), STORE_KEY);
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
      else if (note === "err") netErrors++;
      $surge.logbook("[AI体检] 候选 " + p.slice(0, 16) + " " + (ok ? "OK " + ms + "ms" : "FAIL " + note));
      if (--left === 0) {
        if (passing.length === 0 && netErrors >= BATCH * 2) {
          $surge.logbook("[AI体检] 连续 " + netErrors + " 个网络错误，提前结束扫描");
          return pickGemini(passing);
        }
        scan(cands, idx + BATCH, passing);
      }
    });
  });
}

function pickGemini(passing) {
  if (passing.length === 0) {
    if (netErrors >= BATCH * 2 && !retried) {
      retried = true;
      netErrors = 0;
      $surge.logbook("[AI体检] 链路未就绪，15s 后重试一次");
      setTimeout(function () { scan(members(), 0, []); }, 15000);
      return;
    }
    $surge.logbook("[AI体检] 无可用节点（网络错误 " + netErrors + " 个），保持 " + current());
    return finish(current(), "none-available", "all candidates failed openai check");
  }
  passing.sort(function (a, b) { return a.ms - b.ms; });
  var top = passing.slice(0, 5);
  var i = 0;
  (function next() {
    if (i >= top.length) {
      var best = top[0];
      var cur0 = current();
      var changed0 = best.policy !== cur0;
      var okSet0 = changed0 ? $surge.setSelectGroupPolicy(GROUP, best.policy) : true;
      if (changed0 && okSet0) $notification.post("AI 解锁体检", "已切换（Gemini 未验证）", best.policy);
      return finish(best.policy, changed0 ? (okSet0 ? "switched-no-gemini" : "switch-failed") : "keep-no-gemini", "openai=" + best.ms + "ms");
    }
    var cand = top[i++];
    checkGemini(cand.policy, function (ok, ms, note) {
      if (!ok) return next();
      var cur = current();
      var changed = cand.policy !== cur;
      var okSet = changed ? $surge.setSelectGroupPolicy(GROUP, cand.policy) : true;
      if (changed && okSet) $notification.post("AI 解锁体检", "已切换", cand.policy);
      finish(cand.policy, changed ? (okSet ? "switched" : "switch-failed") : "keep", "openai=" + cand.ms + "ms gemini=" + note);
    });
  })();
}

// ---- 主流程 ----
(function main() {
  var net = $network || {};
  var v4 = (net.v4 && net.v4.primaryAddress) || "";
  var all = members();
  if (all.length === 0) return finish("", "no-group", "🤖 AI 组成员为空");
  if (!v4) { $surge.logbook("[AI体检] 网络未就绪（无 IPv4 地址），跳过本次"); $done(); return; }

  var cur = current();
  if (cur && all.indexOf(cur) >= 0) {
    both(cur, function (ok, note) {
      if (ok) return finish(cur, "keep", note);
      $surge.logbook("[AI体检] 当前节点 " + cur.slice(0, 16) + " 未通过: " + note + "，重试一次");
      setTimeout(function () {
        both(cur, function (ok2, note2) {
          if (ok2) return finish(cur, "keep-retry", note2);
          $surge.logbook("[AI体检] 当前节点重试仍失败: " + note2 + "，重新扫描");
          scan(all, 0, []);
        });
      }, 3000);
    });
  } else {
    scan(all, 0, []);
  }
})();
