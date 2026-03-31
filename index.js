export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // =========================
    // 📊 API：即時 VIX（1分鐘）
    // =========================
    if (url.pathname === "/api/vixtw") {
      try {
        const api =
          "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1m&range=1d";

        const res = await fetch(api);
        const json = await res.json();

        const result = json.chart.result[0];
        const closes = result.indicators.quote[0].close;
        const timestamps = result.timestamp;

        let price = null;
        let time = null;

        // ✅ 找最後有效值（避免 null）
        for (let i = closes.length - 1; i >= 0; i--) {
          if (closes[i] !== null) {
            price = closes[i];
            time = new Date(timestamps[i] * 1000)
              .toLocaleString("zh-TW");
            break;
          }
        }

        if (!price) throw new Error("無即時資料");

        return new Response(
          JSON.stringify({
            status: "success",
            type: "realtime",
            price: price,
            time: time
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );

      } catch (e) {
        return new Response(
          JSON.stringify({
            status: "error",
            price: 0,
            message: "即時 VIX 失敗",
            debug: e.toString()
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // =========================
    // 🌐 前端頁面
    // =========================
    return new Response(generateHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
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
<title>核心資產監控 v8（即時版）</title>

<style>
body {
  background:#0a0a0a;
  color:#fff;
  font-family:sans-serif;
  padding:20px;
  margin:0;
}
.grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
  gap:15px;
}
.card {
  background:#161616;
  border-radius:12px;
  padding:20px;
}
.label {
  color:#888;
  margin-bottom:10px;
}
.price {
  font-size:32px;
  font-weight:bold;
}
.meta {
  font-size:12px;
  color:#888;
}
#debug {
  position:fixed;
  bottom:0;
  left:0;
  width:100%;
  height:120px;
  background:#000;
  color:#0f0;
  font-size:11px;
  overflow:auto;
}
</style>
</head>

<body>

<h2>MY DAILY BRIEF v8（即時版）</h2>

<div class="grid">

  <div class="card">
    <div class="label">鴻勁 7769</div>
    <div id="p1" class="price">--</div>
    <div id="m1" class="meta">載入中</div>
  </div>

  <div class="card">
    <div class="label">VIX 即時恐慌指標</div>
    <div id="p2" class="price">--</div>
    <div id="m2" class="meta">載入中</div>
  </div>

</div>

<div id="debug"></div>

<script>
function log(msg, err=false){
  const box = document.getElementById('debug');
  const el = document.createElement('div');
  el.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg;
  if(err) el.style.color = "red";
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

async function load(){

  // =========================
  // 📈 7769（仍是日資料）
  // =========================
  try {
    log("抓 7769...");
    const s = new Date(Date.now()-7*86400000).toISOString().split('T')[0];

    const r = await fetch(
      'https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=' + s
    );

    const j = await r.json();

    const v = j.data.reverse().find(d => d.close != null);

    document.getElementById('p1').textContent = v.close;
    document.getElementById('m1').textContent = "更新：" + v.date;

    log("7769 OK");

  } catch {
    log("7769 fail", true);
  }

  // =========================
  // 📊 VIX 即時
  // =========================
  try {
    log("抓 VIX 即時...");

    const r = await fetch('/api/vixtw');
    const d = await r.json();

    log(JSON.stringify(d));

    if (d.price > 0) {
      document.getElementById('p2').textContent =
        d.price.toFixed(2);

      document.getElementById('m2').textContent =
        "即時：" + d.time;

      log("VIX OK");
    } else {
      throw new Error();
    }

  } catch {
    log("VIX fail", true);
  }
}

// 🚀 初始載入
load();

// 🔥 每30秒更新（即時）
setInterval(load, 30000);
</script>

</body>
</html>
`;
}
