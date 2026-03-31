export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (url.pathname === "/vix") {
      try {
        const API_KEY = "12F9YHGH3T1063OB";
        // 使用 GLOBAL_QUOTE 接口獲取即時數據
        // 注意：Alpha Vantage 的 VIX 代碼通常直接用 VIX (美股) 
        // 台灣市場資料建議搜尋 TPE 交易所代碼
        const targetUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${API_KEY}`;
        
        const res = await fetch(targetUrl);
        const data = await res.json();

        // Alpha Vantage 的回傳結構比較特別，欄位名帶有數字編號
        const quote = data["Global Quote"];
        
        if (!quote || Object.keys(quote).length === 0) {
          throw new Error("API 回傳空值，可能是達到每分鐘 5 次的免費呼叫上限");
        }

        return new Response(
          JSON.stringify({
            type: "vix_monitor",
            price: parseFloat(quote["05. price"]),
            change: parseFloat(quote["09. change"]),
            changePercent: quote["10. change percent"],
            lastUpdate: quote["07. latest trading day"],
            source: "Alpha Vantage"
          }),
          { headers: corsHeaders }
        );

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    return new Response("Alpha Vantage Worker Active");
  }
};
