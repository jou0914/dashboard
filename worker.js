export default {
  async fetch(request, env, ctx) {
    const ALPHA_KEY = "12F9YHGH3T1063OB";
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8", // 解決中文亂碼
      "Cache-Control": "no-cache"
    };

    const safeFetch = async (label, url) => {
      console.log(`[Request] ${label}: ${url}`);
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          cf: { cacheTtl: 60 }
        });
        
        console.log(`[Response] ${label} Status: ${r.status}`);
        
        if (!r.ok) {
          const errorText = await r.text();
          console.error(`[Error] ${label} failed: ${errorText.substring(0, 100)}`);
          return null;
        }
        
        const data = await r.json();
        console.log(`[Success] ${label} data received.`);
        return data;
      } catch (e) {
        console.error(`[Exception] ${label}: ${e.message}`);
        return null;
      }
    };

    const handle = async () => {
      // 修正日期：往前抓 10 天，確保月初或假日也能拿到至少兩筆資料
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
      const startDate = tenDaysAgo.toISOString().split('T')[0];
      console.log(`[Info] Using startDate for FinMind: ${startDate}`);

      // 併行抓取所有資料
      const [vix, fx, cnn, margin, vixtw] = await Promise.all([
        safeFetch("VIX", "https://query1.finance.yahoo.com/v8/finance/quote?symbols=%5EVIX"),
        safeFetch("FX", `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${ALPHA_KEY}`),
        safeFetch("CNN", "https://api.alternative.me/fng/"),
        safeFetch("Margin", `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=TAIEX&start_date=${startDate}`),
        safeFetch("TWVIX", "https://query1.finance.yahoo.com/v8/finance/quote?symbols=%5ETWVIX")
      ]);

      let result = {};

      // 1. VIX 解析
      const vixResult = vix?.quoteResponse?.result?.[0];
      if (vixResult) {
        result.vix = vixResult.regularMarketPrice;
        console.log(`[Parsed] VIX: ${result.vix}`);
      }

      // 2. USD/TWD
      const fxData = fx?.["Realtime Currency Exchange Rate"];
      if (fxData?.["5. Exchange Rate"]) {
        result.twd = parseFloat(fxData["5. Exchange Rate"]);
        console.log(`[Parsed] TWD: ${result.twd}`);
      }

      // 3. CNN Fear & Greed
      if (cnn?.data?.[0]) {
        result.cnn = parseInt(cnn.data[0].value);
        result.cnnLabel = cnn.data[0].value_classification;
        console.log(`[Parsed] CNN: ${result.cnn} (${result.cnnLabel})`);
      }

      // 4. 融資融券
      if (margin?.data && margin.data.length >= 2) {
        const last = margin.data[margin.data.length - 1];
        const prev = margin.data[margin.data.length - 2];
        result.marginChange = last.MarginPurchaseBalance - prev.MarginPurchaseBalance;
        result.shortChange = last.ShortSaleBalance - prev.ShortSaleBalance;
        console.log(`[Parsed] Margin Change: ${result.marginChange}`);
      } else {
        console.warn(`[Warn] Margin data insufficient. Length: ${margin?.data?.length || 0}`);
      }

      // 5. 台指 VIX
      const twVixResult = vixtw?.quoteResponse?.result?.[0];
      if (twVixResult) {
        result.vixtw = twVixResult.regularMarketPrice;
        console.log(`[Parsed] TWVIX: ${result.vixtw}`);
      }

      // 情緒評分
      let score = 0;
      if (result.vix !== undefined) {
        if (result.vix > 30) score -= 2;
        else if (result.vix > 20) score -= 1;
      }
      if (result.cnn !== undefined) {
        if (result.cnn < 25) score += 1.5;
        else if (result.cnn > 75) score -= 1.5;
      }
      if (result.marginChange !== undefined) {
        if (result.marginChange > 0) score += 0.5;
        else if (result.marginChange < 0) score -= 0.5;
      }

      result.sentiment = score >= 1 ? "偏多" : (score <= -1 ? "偏空" : "中性");
      result.score = score;
      result.updatedAt = new Date().toISOString();
      
      console.log(`[Final] Score: ${score}, Sentiment: ${result.sentiment}`);
      return result;
    };

    try {
      const finalData = await handle();
      return new Response(JSON.stringify(finalData), { headers });
    } catch (e) {
      console.error(`[Fatal] ${e.message}`);
      return new Response(JSON.stringify({ error: e.message }), { headers, status: 500 });
    }
  }
};
