export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API 路由：處理數據抓取
    if (url.pathname === "/api/vixtw") {
      try {
        const now = new Date();
        const endDate = new Date(now.getTime() + 8 * 3600000).toISOString().split('T')[0];
        const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        
        // 抓取 VIXTW
        const finUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockIndexPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
        const res = await fetch(finUrl);
        const json = await res.json();

        if (!json.data || json.data.length === 0) throw new Error("無數據");
        
        const latest = json.data[json.data.length - 1];
        return new Response(JSON.stringify({
          status: "success",
          price: parseFloat(latest.close),
          date: latest.date
        }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 200 });
      }
    }

    // 網頁路由：回傳儀表板介面
    return new Response(generateHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }
};

function generateHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>核心資產 v6.6</title>
    <style>
        :root { --bg:#0a0a0a; --card:#161616; --border:#262626; --text:#fff; --muted:#888; --yellow:#f6ad55; --red:#f56565; --green:#48bb78; }
        body { background:var(--bg); color:var(--text); font-family:sans-serif; padding:20px; }
        .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:15px; }
        .card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:20px; }
        .price { font-size:2rem; font-weight:bold; margin:10px 0; }
        #debug { position:fixed; bottom:0; left:0; width:100%; height:80px; background:rgba(0,0,0,0.9); color:#00ff00; font-family:monospace; font-size:11px; padding:10px; overflow-y:auto; border-top:1px solid #444; }
    </style>
</head>
<body>
    <div style="font-weight:bold; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:20px;">
        MY DAILY BRIEF / <span style="color:var(--yellow)">v6.6 FINAL</span>
    </div>
    <div class="grid">
        <div class="card">
            <div style="color:var(--muted)">鴻勁 (7769:TPE)</div>
            <div id="p-7769" class="price">--</div>
            <div id="m-7769" style="font-size:0.8rem">載入中...</div>
        </div>
        <div class="card">
            <div style="color:var(--muted)">台股波動率 VIXTW</div>
            <div id="p-vix" class="price">--</div>
            <div id="m-vix" style="font-size:0.8rem">等待數據...</div>
        </div>
    </div>
    <div id="debug"><div>[SYSTEM] 初始化日誌...</div></div>
    <script>
        function log(m, err=false) {
            const d = document.createElement('div');
            if(err) d.style.color = '#f56565';
            d.textContent = "[" + new Date().toLocaleTimeString() + "] " + m;
            const b = document.getElementById('debug'); b.appendChild(d); b.scrollTop = b.scrollHeight;
        }
        async function init() {
            log("抓取 7769...");
            fetch('https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=' + new Date(Date.now()-604800000).toISOString().split('T')[0])
            .then(r=>r.json()).then(j=>{
                const c = j.data[j.data.length-1];
                document.getElementById('p-7769').textContent = parseFloat(c.close).toLocaleString();
                document.getElementById('m-7769').textContent = "更新：" + c.date;
                log("7769 成功");
            }).catch(e=>log("7769 失敗", true));

            log("請求 /api/vixtw...");
            fetch('/api/vixtw').then(r=>r.json()).then(d=>{
                if(d.error) throw new Error(d.error);
                document.getElementById('p-vix').textContent = d.price.toFixed(2);
                document.getElementById('m-vix').textContent = "更新：" + d.date;
                log("VIXTW 成功");
            }).catch(e=>log("VIX 失敗: " + e.message, true));
        }
        init();
    </script>
</body>
</html>
  `;
}
