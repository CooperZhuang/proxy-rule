// 全局扩展脚本 — 所有 profile 生效（Windows / macOS 通用）
// 统一分组命名、补齐高阶分组、自定义规则收进 sub-rules、端口规则插到 MATCH 前

const EMOJI = {
  "手动": "🖱️ 手动选择", "加速": "🚀 节点选择", "苹果": "🍎 苹果", "AI": "🤖 AI",
  "网易云": "🎵 网易云", "电报": "📲 电报", "拦截": "🛑 广告拦截", "兜底": "🐟 兜底",
  "自动": "♻️ 自动选择", "香港": "🇭🇰 香港", "日本": "🇯🇵 日本", "美国": "🇺🇸 美国",
  "台湾": "🇹🇼 台湾", "新国": "🇸🇬 新加坡", "Teams": "💼 Teams",
  "🚀 手动切换": "🖱️ 手动选择", "🌏 全球加速": "🚀 节点选择", "🍎 苹果微软": "🍎 苹果",
  "🎵 网易云音乐": "🎵 网易云", "📟 电报消息": "📲 电报", "🆎 AdBlock": "🛑 广告拦截",
  "🐟 兜底分流": "🐟 兜底", "🇭🇰 香港节点": "🇭🇰 香港", "🇯🇵 日本节点": "🇯🇵 日本",
  "🇺🇲 美国节点": "🇺🇸 美国", "🇨🇳 台湾节点": "🇹🇼 台湾", "🇸🇬 狮城节点": "🇸🇬 新加坡",
};

const EXTRA_GROUPS = [
  { name: "💼 Teams", filter: "(?i)(香港|日本|新加坡|新国|SG|HK|JP)", url: "https://teams.microsoft.com/robots.txt" },
  { name: "🤖 AI", filter: "(?i)^(?!.*(香港|HK|深港|沪港|广港)).*(美国|US|日本|JP|NTT|新加坡|新国|SG|台湾|TW).*$", url: "https://chatgpt.com/robots.txt" },
  { name: "🎬 媒体解锁", filter: "(?i).*\\[M\\].*倍率:1\\]$", url: "https://www.gstatic.com/generate_204" },
  { name: "⚡ 高倍节点", filter: "倍率:(1\\.[5-9]|[2-9](\\.[0-9])?)\\]$", url: "https://www.gstatic.com/generate_204" },
  { name: "🪫 低倍节点", filter: "(?i)^(?!.*Premium).*倍率:(0\\.[0-9]|1)\\]$", url: "https://www.gstatic.com/generate_204" },
  { name: "🐙 GitHub", filter: "(?i)上海电信转香港(HKC|HKT|BGP)", url: "https://www.gstatic.com/generate_204" },
];

const TOP_RULES = [
  "PROCESS-NAME,ms-teams.exe,💼 Teams", "PROCESS-NAME,Teams.exe,💼 Teams", "PROCESS-NAME,MSTeams,💼 Teams",
  "DOMAIN-SUFFIX,openai.com,🤖 AI", "DOMAIN-SUFFIX,chatgpt.com,🤖 AI", "DOMAIN-SUFFIX,gemini.google.com,🤖 AI",
  "DOMAIN-SUFFIX,aistudio.google.com,🤖 AI", "DOMAIN-SUFFIX,bard.google.com,🤖 AI",
  "DOMAIN-SUFFIX,claude.ai,🤖 AI", "DOMAIN-SUFFIX,anthropic.com,🤖 AI", "DOMAIN-SUFFIX,copilot.microsoft.com,🤖 AI",
  "DOMAIN-SUFFIX,release-assets.githubusercontent.com,🐙 GitHub", "DOMAIN-SUFFIX,objects.githubusercontent.com,🐙 GitHub",
  "DOMAIN-SUFFIX,codeload.github.com,🐙 GitHub", "DOMAIN-SUFFIX,raw.githubusercontent.com,🐙 GitHub",
  "DOMAIN,api.github.com,🐙 GitHub",
];
const SUB_RULE_NAME = "custom-route";
const SUB_RULE_REFS = ["SUB-RULE,(NETWORK,tcp)," + SUB_RULE_NAME, "SUB-RULE,(NETWORK,udp)," + SUB_RULE_NAME];
const PORT_RULES = ["DST-PORT,22,⚡ 高倍节点", "DST-PORT,3389,⚡ 高倍节点", "DST-PORT,5900,⚡ 高倍节点"];
const STEAM_DIRECT = [
  "DOMAIN-SUFFIX,steamcontent.com,DIRECT", "DOMAIN-SUFFIX,steamchina.com,DIRECT",
  "DOMAIN-SUFFIX,steamcdn.com,DIRECT", "DOMAIN-SUFFIX,steamusercontent.com,DIRECT",
  "DOMAIN-SUFFIX,wmsjsteam.com,DIRECT", "DOMAIN-SUFFIX,8686c.com,DIRECT",
  "DOMAIN-SUFFIX,dl.steam.clngaa.com,DIRECT", "DOMAIN-SUFFIX,st.dl.eccdnx.com,DIRECT",
  "DOMAIN-SUFFIX,dl.delivery.mp.microsoft.com,DIRECT", "DOMAIN-SUFFIX,assets1.xboxlive.cn,DIRECT",
  "DOMAIN-SUFFIX,assets2.xboxlive.cn,DIRECT",
];

function main(config) {
  if (!config) return config;
  const groups = config["proxy-groups"] || [];

  const rename = {};
  groups.forEach(function (g) { if (EMOJI[g.name]) rename[g.name] = EMOJI[g.name]; });
  if (Object.keys(rename).length) {
    groups.forEach(function (g) {
      if (g.proxies) g.proxies = g.proxies.map(function (p) { return rename[p] || p; });
      if (rename[g.name]) g.name = rename[g.name];
    });
    config.rules = (config.rules || []).map(function (r) {
      const parts = r.split(",");
      const pol = parts[parts.length - 1].trim();
      if (rename[pol]) parts[parts.length - 1] = rename[pol];
      return parts.join(",");
    });
  }

  const hasProviders = !!(config["proxy-providers"] && Object.keys(config["proxy-providers"]).length);
  const names = groups.map(function (g) { return g.name; });
  EXTRA_GROUPS.forEach(function (eg) {
    if (names.indexOf(eg.name) >= 0) return;
    const ng = { name: eg.name, type: "url-test", url: eg.url, interval: 600, tolerance: 50, lazy: true, filter: eg.filter };
    if (hasProviders) ng["include-all-providers"] = true; else ng["include-all"] = true;
    groups.push(ng);
  });

  config["sub-rules"] = Object.assign({}, config["sub-rules"] || {}, { [SUB_RULE_NAME]: TOP_RULES });
  let rules = (config.rules || []).filter(function (r) { return r && r.trim() !== ""; });
  rules = rules.filter(function (r) { return TOP_RULES.indexOf(r) < 0 && SUB_RULE_REFS.indexOf(r) < 0 && PORT_RULES.indexOf(r) < 0; });
  const matchIdx = rules.findIndex(function (r) { return r.indexOf("MATCH,") === 0; });
  const tail = matchIdx >= 0 ? rules.slice(matchIdx) : [];
  const head = matchIdx >= 0 ? rules.slice(0, matchIdx) : rules;
  config.rules = SUB_RULE_REFS.concat(STEAM_DIRECT.filter(function (r) { return head.indexOf(r) < 0; }), head, PORT_RULES, tail);

  groups.forEach(function (g) { if (g.url === "http://www.gstatic.com/generate_204") g.url = "https://www.gstatic.com/generate_204"; });
  if (!config["find-process-mode"]) config["find-process-mode"] = "strict";
  config["tcp-concurrent"] = true;
  config["global-client-fingerprint"] = config["global-client-fingerprint"] || "chrome";
  const seenP = {};
  config.proxies = (config.proxies || []).filter(function (p) { if (seenP[p.name]) return false; seenP[p.name] = true; return true; });
  const seenR = {};
  config.rules = config.rules.filter(function (r) {
    if (r.indexOf("MATCH,") === 0) return true;
    if (seenR[r]) return false; seenR[r] = true; return true;
  });
  return config;
}
