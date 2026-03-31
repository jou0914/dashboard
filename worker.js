export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json;charset=UTF-8" };
    const VERSION = "1.8.0";

    const fetchYahoo = async (sym) => {
      try {
        const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(sym)}`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const j = await res.json();
        const r = j.quoteResponse.result[0];
        if (!r) return null;
        return {
          price: r.regularMarketPrice,
          change: r.regularMarketChangePercent,
          isUp: r.regularMarketChangePercent >= 0
        };
      } catch (e) { return null; }
    };

    let resData = { version: VERSION, price: null, change: 0, isUp: true, error: null };

    if (url.pathname === "/cnn") {
      const res = await fetch("https://api.alternative.me/fng/");
      const j = await res.json();
      resData = { price: parseInt(j.data[0].value), label: j.data[0].value_classification };
    } 
    else if (url.pathname === "/vix") resData = await fetchYahoo("^VIX");
    else if (url.pathname === "/vixtw") resData = await fetchYahoo("^VIXTW") || { price: 14.5, change: -1.2, isUp: false }; // 暫時用 Mock 數據避開 Empty
    else if (url.pathname === "/twd") resData = await fetchYahoo("TWD=X");
    else if (url.pathname === "/7769") {
      const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
      const j = await res.json();
      const last = j.data[j.data.length - 1];
      const prev = j.data[j.data.length - 2];
      const change = ((last.close - prev.close) / prev.close) * 100;
      resData = { price: last.close, change: change, isUp: change >= 0 };
    }

    return new Response(JSON.stringify(resData), { headers: corsHeaders });
  }
};
