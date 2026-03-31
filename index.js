export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // =========================
    // 📊 API：VIX（改用美股 ^VIX）
    // =========================
    if (url.pathname === "/api/vixtw") {
      try {
        const start = new Date(Date.now() - 7 * 86400000)
          .toISOString()
          .split("T")[0];

        const fmUrl =
          `https://api.finmindtrade.com/api/v4/data?dataset=USStockPrice&data_id=^VIX&start_date=${start}`;

        const res = await fetch(fmUrl);
        const json = await res.json();

        if (!json.data || json.data.length === 0) {
          throw new Error("無數據");
        }

        const latest = json.data[json.data.length - 1];

        return new Response(
          JSON.stringify({
            status: "success",
            price: parseFloat(latest.close),
            date: latest.date,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({
            status: "error",
            price: 0,
            message: "VIX API 失敗",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // =========================
    // 🌐 預設：回傳前端頁面
    // =========================
    return new Response(generateHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  },
};

// =========================
// 🖥️ HTML Dashboard
// =========================
function generateHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>核心資產監控 v7</title>

<style>
:root {
  --bg:#0a0a0a;
  --card:#161616;
  --border:#262626;
  --text:#fff;
  --muted:#888;
  --yellow:#f6ad55;
}
body {
  background:var(--bg);
  color:var(--text);
  font-family:sans-serif;
  padding:20px;
  margin:0;
}
.header {
  display:flex;
  justify-content:space-between;
  border-bottom:1px solid var(--border);
  padding-bottom:15px;
  margin-bottom:25px;
}
.grid {
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));
  gap:15px;
}
.card {
  background:var(--card);
  border:1px solid var(--border);
  border-radius:12px;
  padding:20px;
}
.label {
  color:var(--muted);
  font-size:14px;
  margin-bottom:10px;
}
.price {
  font-size:32px;
  font-weight:bold;
}
.meta {
  font-size:12px;
  color:var(--muted);
  margin-top:10px;
}
#debug {
  position:fixed;
  bottom:0;
  left:0;
  width:100%;
  height:100px;
  background:rgba(0,0,0,0.9);
  color:#00ff00;
  font-family:monospace;
  font-size:11px;
  padding:10px;
  overflow-y:auto;
  border-top:1px solid #333;
}
</style>
</head>

<body>

<div class="header">
  <div style="font-weight:bold;">MY DAILY BRIEF</div>
  <div style="color:var(--yellow); font-size:12px;">v7 Cloudflare 穩定版</div>
</div>

<div class="grid">

  <div class="card">
    <div class="label">鴻勁 (7769:TPE)</div>
    <div id="p-7769" class="price">--</div>
    <div id="m-7769" class="meta">載入中...</div>
  </div>

  <div class="card">
    <div class="label">市場恐慌指標 (VIX)</div>
    <div id="p-vix" class="price">--</div>
    <div id="m-vix" class="meta">等待數據...</div>
  </div>

</div>

<div id="debug"></div>

<script>
function log(msg, error=false) {
  const box = document.getElementById('debug');
  const line = document.createElement('div');
  line.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg;
  if(error) line.style.color = "#f56565";
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

// =========================
// 🚀 主流程
// =========================
async function load() {

  // =========================
  // 📈 7769
  // =========================
  try {
    log("抓取 7769...");
    const start = new Date(Date.now()-604800000).toISOString().split('T')[0];

    const res = await fetch(
      'https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=' + start
    );

    const json = await res.json();

    if (!json.data || json.data.length === 0) throw new Error();

    const latest = json.data[json.data.length - 1];

    document.getElementById('p-7769').textContent =
      parseFloat(latest.close).toLocaleString();

    document.getElementById('m-7769').textContent =
      "更新：" + latest.date;

    log("7769 成功");

  } catch (e) {
    log("7769 失敗", true);
  }

  // =========================
  // 📊 VIX（走 Worker）
  // =========================
  try {
    log("請求 /api/vixtw ...");

    const res = await fetch('/api/vixtw');
    const data = await res.json();

    log("VIX 回傳：" + JSON.stringify(data));

    if (data.price > 0) {
      document.getElementById('p-vix').textContent =
        data.price.toFixed(2);

      document.getElementById('m-vix').textContent =
        "更新：" + data.date;

      log("VIX 成功");
    } else {
      throw new Error();
    }

  } catch (e) {
    log("VIX 失敗", true);
    document.getElementById('m-vix').textContent =
      "資料來源異常";
  }
}

load();
</script>

</body>
</html>
  `;
}
