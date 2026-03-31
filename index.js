export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- [API 路由] 使用 FinMind 抓取台股 VIX ---
    if (url.pathname === "/api/vixtw") {
      try {
        const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        // FinMind 代碼：VIXTW (台股波動率指數)
        const fmUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockIndexPrice&data_id=VIXTW&start_date=${start}`;
        
        const res = await fetch(fmUrl);
        const json = await res.json();
        
        if (!json.data || json.data.length === 0) throw new Error("無數據");
        
        const latest = json.data[json.data.length - 1];
        
        return new Response(JSON.stringify({
          status: "success",
          price: parseFloat(latest.close),
          date: latest.date
        }), { 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "API 維護中", price: 0 }), { 
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>核心資產監控 v6.7</title>
    <style>
        :root { --bg:#0a0a0a; --card:#161616; --border:#262626; --text:#fff; --muted:#888; --yellow:#f6ad55; }
        body { background:var(--bg); color:var(--text); font-family:sans-serif; padding:20px; margin:0; }
        .header { display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:15px; margin-bottom:25px; }
        .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:15px; }
        .card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:20px; }
        .label { color:var(--muted); font-size:14px; margin-bottom:10px; }
        .price { font-size:32px; font-weight:bold; }
        .meta { font-size:12px; color:var(--muted); margin-top:10px; }
        #debug { position:fixed; bottom:0; left:0; width:100%; height:80px; background:rgba(0,0,0,0.9); color:#00ff00; font-family:monospace; font-size:11px; padding:10px; overflow-y:auto; border-top:1px solid #333; pointer-events:none; }
    </style>
</head>
<body>
    <div class="header">
        <div style="font-weight:bold;">MY DAILY BRIEF</div>
        <div style="color:var(--yellow); font-size:12px;">v6.7 FinMind 版</div>
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
            <div id="m-vix" class="meta">等待數據...</div>
        </div>
    </div>
    <div id="debug"><div>[SYSTEM] 初始化...</div></div>
    <script>
        function log(m, e=false) {
            const b = document.getElementById('debug');
            const d = document.createElement('div'); if(e) d.style.color='#f56565';
            d.textContent = "[" + new Date().toLocaleTimeString() + "] " + m;
            b.appendChild(d); b.scrollTop = b.scrollHeight;
        }
        async function load() {
            // 抓取 7769
            try {
                const s = new Date(Date.now()-604800000).toISOString().split('T')[0];
                const r = await fetch('https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=' + s);
                const j = await r.json();
                const l = j.data[j.data.length-1];
                document.getElementById('p-7769').textContent = parseFloat(l.close).toLocaleString();
                document.getElementById('m-7769').textContent = "更新：" + l.date;
                log("7769 成功");
            } catch { log("7769 失敗", true); }

            // 抓取 VIXTW
            log("請求 /api/vixtw...");
            try {
                const r = await fetch('/api/vixtw');
                const d = await r.json();
                if(d.price > 0) {
                    document.getElementById('p-vix').textContent = d.price.toFixed(2);
                    document.getElementById('m-vix').textContent = "更新：" + d.date;
                    log("VIX 成功");
                } else throw new Error();
            } catch {
                log("VIX 失敗", true);
                document.getElementById('m-vix').textContent = "數據源暫時離線";
            }
        }
        load();
    </script>
</body>
</html>
  `;
}
