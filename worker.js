export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (url.pathname === "/vix") {
      try {
        // 使用 iThome 文章推薦的 v7 quote API
        // ^VIXTWN 是台指 VIX 的代號
        const targetUrl = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=^VIXTWN";
        
        const res = await fetch(targetUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        if (!res.ok) throw new Error(`Yahoo API 響應錯誤: ${res.status}`);

        const data = await res.json();
        
        // 檢查路徑是否存在
        if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
          throw new Error("找不到代號數據，請確認市場是否已開盤或代號正確");
        }

        const result = data.quoteResponse.result[0];

        // 提取關鍵欄位
        return new Response(
          JSON.stringify({
            type: "taiwan_vix",
            price: result.regularMarketPrice,           // 當前成交價
            change: result.regularMarketChange,         // 漲跌
            changePercent: result.regularMarketChangePercent, // 漲跌幅
            prevClose: result.regularMarketPreviousClose, // 昨收
            name: result.shortName,                     // 指數名稱
            time: new Date(result.regularMarketTime * 1000).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
            status: result.marketState                  // 市場狀態 (REGULAR/CLOSED)
          }),
          { headers: corsHeaders }
        );

      } catch (e) {
        return new Response(JSON.stringify({ 
          error: e.message,
          tip: "若出現 404/403，可能是 Yahoo 暫時封鎖 Worker IP" 
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    return new Response("Taiwan VIX Monitor (v7) is Online");
  }
};
