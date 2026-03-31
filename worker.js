export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (url.pathname === "/vix") {
      try {
        // 直接請求 Yahoo Finance 的 Chart API (台指 VIX 代碼: ^VIXTWN)
        // 參數 range=1d 代表取一天內的資料, interval=1m 代表分鐘級距
        const targetUrl = "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIXTWN?range=1d&interval=1m";
        
        const res = await fetch(targetUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
          }
        });
        
        if (!res.ok) throw new Error(`Yahoo API 回傳錯誤: ${res.status}`);

        const data = await res.json();

        // 解析 JSON 結構
        const result = data.chart.result[0];
        const meta = result.meta;
        const indicators = result.indicators.quote[0];
        
        // 取得最新的一筆價格 (close)
        const prices = indicators.close;
        const currentPrice = prices[prices.length - 1] || meta.regularMarketPrice;

        return new Response(
          JSON.stringify({
            type: "taiwan_vix",
            price: parseFloat(currentPrice.toFixed(2)),
            prev_close: meta.previousClose,
            change: parseFloat((currentPrice - meta.previousClose).toFixed(2)),
            symbol: meta.symbol,
            time: new Date(meta.regularMarketTime * 1000).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
            source: "Yahoo Finance API"
          }),
          { headers: corsHeaders }
        );

      } catch (e) {
        return new Response(JSON.stringify({ 
          error: e.message,
          suggestion: "請確認網路連線或稍後再試" 
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    return new Response("Taiwan VIX API Worker is Active");
  }
};
