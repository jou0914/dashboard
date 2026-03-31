export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- [API 路由] 處理 VIX 數據 (使用 Google Finance 備援) ---
    if (url.pathname === "/api/vixtw") {
      try {
        // 直接抓取 Google Finance 台股 VIX 頁面
        const gUrl = `https://www.google.com/finance/quote/VIXTW:INDEXTPE`;
        const res = await fetch(gUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        
        const text = await res.text();
        
        // 使用正則表達式精準定位 Google Finance 的最後收盤價標籤
        const priceMatch = text.match(/data-last-price="([\d\.]+)"/);
        const latestPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

        if (!latestPrice) throw new Error("數據解析失敗");

        return new Response(JSON.stringify({
          status: "success",
          price: latestPrice,
          date: new Date().toLocaleDateString('zh-TW')
        }), { 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          } 
        });
      } catch (e) {
        // 若 Google 也失敗，回傳模擬參考值確保介面不跳錯
        return new Response(JSON.stringify({ 
          error: "數據源更新中", 
          price: 0, 
          date: "請稍後再試" 
        }), { 
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
            border-radius: 12px; padding: 20px;
        }
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
            <div id="m-vix" class="meta">等待數據...</div>
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
                log("7769 載入失敗", true);
            }
        }

        async function fetchVIX() {
            log("請求 /api/vixtw...");
            try {
                const res = await fetch('/api/vixtw');
                const data = await res.json();
                
                if (data.error || data.price === 0) throw new Error(data.error || "無數據");
                
                document.getElementById('p-vix').textContent = data.price.toFixed(2);
                document.getElementById('m-vix').textContent = "更新日期：" + data.date;
                log("VIX 載入成功");
            } catch (e) {
                log("VIX 失敗：" + e.message, true);
                document.getElementById('m-vix').textContent = "來源端限制中";
            }
        }

        fetchStock();
        fetchVIX();
    </script>
</body>
</html>
  `;
}
