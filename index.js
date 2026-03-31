export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- [API 路由] 處理 VIX 數據 ---
    if (url.pathname === "/api/vixtw") {
      try {
        // 使用更穩定的 Yahoo Finance 備援網址
        const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/%5EVIXTW?interval=1d&range=5d`;
        const res = await fetch(yfUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) throw new Error("遠端伺服器回應錯誤: " + res.status);
        
        const json = await res.json();
        const result = json.chart.result[0];
        const quote = result.indicators.quote[0];
        
        // 取得最新一筆有效價格
        const prices = quote.close.filter(p => p !== null && p !== undefined);
        if (prices.length === 0) throw new Error("無效數據");
        
        const latestPrice = prices[prices.length - 1];
        const timestamp = result.timestamp[result.timestamp.length - 1];
        const date = new Date(timestamp * 1000).toLocaleDateString('zh-TW');

        return new Response(JSON.stringify({
          status: "success",
          price: parseFloat(latestPrice.toFixed(2)),
          date: date
        }), { 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          } 
        });
      } catch (e) {
        // 如果 Yahoo 失敗，回傳一個友善的錯誤訊息
        return new Response(JSON.stringify({ error: "數據源更新中" }), { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        });
      }
    }

    // --- [網頁路由] 回傳儀表板介面 ---
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <title>核心資產監控 v6.6</title>
    <style>
        :root { --bg:#0a0a0a; --card:#161616; --border:#262626; --text:#fff; --muted:#888; --yellow:#f6ad55; --red:#f56565; }
        body { background:var(--bg); color:var(--text); font-family:sans-serif; padding:20px; margin:0; }
        .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:15px; margin-top:20px; }
        .card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:20px; }
        .label { color:var(--muted); font-size:14px; margin-bottom:10px; }
        .price { font-size:2.5rem; font-weight:bold; }
        .meta { font-size:12px; color:var(--muted); margin-top:10px; }
        #debug { position:fixed; bottom:0; left:0; width:100%; height:80px; background:rgba(0,0,0,0.9); color:#00ff00; font-family:monospace; font-size:11px; padding:10px; overflow-y:auto; border-top:1px solid #333; box-sizing:border-box; }
    </style>
</head>
<body>
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px;">
        <div style="font-weight:bold;">MY DAILY BRIEF</div>
        <div style="color:var(--yellow); font-size:12px;">v6.6 FINAL</div>
    </div>
    <div class="grid">
        <div class="card">
            <div class="label">鴻勁 (7769:TPE)</div>
            <div id="p-7769" class="price">--</div>
            <div id="m-7769" class="meta">載入中...</div>
        </div>
        <div class="card">
            <div class="label">台股波動率 VIXTW</div>
            <div id="p-vix" class="price">--</div>
            <div id="m-vix" class="meta">更新中...</div>
        </div>
    </div>
    <div id="debug"><div>[SYSTEM] 初始化中...</div></div>
    <script>
        function log(m, e=false) {
            const d = document.createElement('div'); if(e) d.style.color='#f56565';
            d.textContent = "[" + new Date().toLocaleTimeString() + "] " + m;
            const b = document.getElementById('debug'); b.appendChild(d); b.scrollTop = b.scrollHeight;
        }
        async function load() {
            // 抓取 7769
            fetch('https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=' + new Date(Date.now()-604800000).toISOString().split('T')[0])
            .then(r=>r.json()).then(j=>{
                const c = j.data[j.data.length-1];
                document.getElementById('p-7769').textContent = parseFloat(c.close).toLocaleString();
                document.getElementById('m-7769').textContent = "更新：" + c.date;
                log("7769 成功");
            }).catch(()=>log("7769 失敗", true));

            // 抓取 VIXTW
            log("請求 /api/vixtw...");
            fetch('/api/vixtw').then(r=>r.json()).then(d=>{
                if(d.error) throw new Error(d.error);
                document.getElementById('p-vix').textContent = d.price.toFixed(2);
                document.getElementById('m-vix').textContent = "更新：" + d.date;
                log("VIX 成功");
            }).catch(e=>{
                log("VIX 失敗: " + e.message, true);
                document.getElementById('m-vix').textContent = "來源端限制中";
            });
        }
        load();
    </script>
</body>
</html>
  `;
}
