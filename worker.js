export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json;charset=UTF-8" };
    const API_KEY = "12F9YHGH3T1063OB";
    const VERSION = "1.6.0";

    // 模擬真實瀏覽器 Header
    const getHeaders = () => ({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Referer": "https://finance.yahoo.com/"
    });

    let resData = { version: VERSION, price: null, error: null };

    try {
      if (url.pathname === "/cnn") {
        const res = await fetch("https://api.alternative.me/fng/");
        const j = await res.json();
        resData = { price: parseInt(j.data[0].value), label: j.data[0].value_classification };
      } 
      else if (url.pathname === "/vix" || url.pathname === "/vixtw") {
        // 針對 401 錯誤，改用 yfinance 的公開原始路徑嘗試
        const sym = url.pathname === "/vix" ? "%5EVIX" : "%5EVIXTW";
        const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`, { headers: getHeaders() });
        const j = await res.json();
        const price = j.chart.result[0].meta.regularMarketPrice;
        resData.price = price;
      }
      else if (url.pathname === "/twd") {
        // 匯率雙源備援
        const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${API_KEY}`);
        const j = await res.json();
        const rate = j["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
        if (rate) {
          resData.price = parseFloat(rate);
        } else {
          // 備援源：免 API KEY
          const res2 = await fetch("https://open.er-api.com/v6/latest/USD");
          const j2 = await res2.json();
          resData.price = j2.rates.TWD;
        }
      }
      else if (url.pathname === "/7769") {
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
        const j = await res.json();
        resData.price = j.data?.pop()?.close;
      }
    } catch (e) {
      resData.error = e.message;
    }

    return new Response(JSON.stringify(resData), { headers: corsHeaders });
  }
};
