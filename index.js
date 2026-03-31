export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- [後端邏輯] 處理數據請求，解決 404 錯誤 ---
    if (url.pathname === "/api/vixtw") {
      try {
        // 改用更穩定的 Yahoo Finance 數據源抓取台股 VIX (^VIXTW)
        const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5EVIXTW?interval=1d&range=5d`;
        const res = await fetch(yfUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const json = await res.json();
        
        const result = json.chart.result[0];
        const quote = result.indicators.quote[0];
        
        // 取得最新一筆非空的收盤價
        const prices = quote.close.filter(p => p !== null);
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
        return new Response(JSON.stringify({ error: "VIX 數據暫時不可用" }), { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        });
      }
    }

    // --- [前端邏輯] 回傳儀表板介面 ---
    return new Response(generateHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }
};

// --- [介面設計] 包含 CSS 與 JS ---
function generateHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>核心資產監控 v6.6</title>
    <style>
        :root { 
            --bg: #0a0a0a; --card: #161616; --border: #262626; 
            --text: #ffffff; --muted: #888888; --yellow: #f6ad55; 
            --red: #f56565; --green: #48bb78; 
        }
        body { 
            background: var(--bg); color: var(--text); 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            padding: 20px; margin: 0; line-height: 1.5;
        }
        .header { 
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 25px;
        }
        .version { color: var(--yellow); font-size: 12px; font-weight: bold; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .card { 
            background: var(--card); border: 1px solid var(--border); 
            border-radius: 12px; padding: 20px; transition: transform 0.2s;
        }
        .card:active { transform: scale(0.98); }
        .label { color: var(--muted); font-size: 14px; margin-bottom: 8px; }
        .price { font-size: 32px; font-weight: bold; font-variant-numeric: tabular-nums; }
        .meta { font-size: 12px; color: var(--muted); margin-top: 10px; }
        #debug { 
            position: fixed; bottom: 0; left: 0; width: 100%; height: 100px; 
            background: rgba(0,0,0,0.9); color: #00ff00; font-family: monospace; 
            font-size: 11px; padding: 10px; overflow-y: auto; border-top: 1px solid #333;
            box-sizing: border-box; pointer-events: none; opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="header">
        <div style="font-size: 18px; font-weight: bold;">MY DAILY BRIEF</div>
        <div class="version">v6.6 FINAL</div>
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
            <div id="m-vix" class="meta">等待數據更新...</div>
        </div>
    </div>

    <div id="debug"><div>[SYSTEM] 初始化環境中...</div></div>

    <script>
        function log(m, isError = false) {
            const container = document.getElementById('debug');
            const entry = document.createElement('div');
            if (isError) entry.style.color = '#f56565';
            entry.textContent = "[" + new Date().toLocaleTimeString() + "] " + m;
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
        }

        async function fetchStock() {
            log("正在抓取個股 7769...");
            try {
                // 使用 FinMind 抓取鴻勁數據
                const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
                const res = await fetch('https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=' + start);
                const json = await res.json();
                const latest = json.data[json.data.length - 1];
                
                document.getElementById('p-7769').textContent = parseFloat(latest.close).toLocaleString();
                document.getElementById('m-7769').textContent = "更新時間：" + latest.date;
                log("7769 數據載入成功");
            } catch (e) {
                log("7769 載入失敗: " + e.message, true);
            }
        }

        async function fetchVIX() {
            log("請求 /api/vixtw...");
            try {
                const res = await fetch('/api/vixtw');
                const data = await res.json();
                
                if (data.error) throw new Error(data.error);
                
                document.getElementById('p-vix').textContent = data.price.toFixed(2);
                document.getElementById('m-vix').textContent = "更新日期：" + data.date;
                log("VIX 載入成功");
            } catch (e) {
                log("VIX 請求失敗: " + e.message, true);
                document.getElementById('p-vix').style.color = '#f56565';
                document.getElementById('m-vix').textContent = "數據源連線異常";
            }
        }

        // 執行初始化
        fetchStock();
        fetchVIX();
    </script>
</body>
</html>
  `;
}
