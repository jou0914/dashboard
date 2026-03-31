export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json;charset=UTF-8" };
    const VERSION = "1.7.0";

    const fetchYahooV8 = async (sym) => {
      try {
        const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1m&range=1d`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const j = await res.json();
        return j.chart.result[0].meta.regularMarketPrice || null;
      } catch (e) { return null; }
    };

    let resData = { version: VERSION, price: null, error: null };

    if (url.pathname === "/cnn") {
      try {
        const res = await fetch("https://api.alternative.me/fng/");
        const j = await res.json();
        const price = parseInt(j.data[0].value);
        resData = { price: price, label: j.data[0].value_classification, percent: Math.round(price) };
      } catch (e) { resData.error = "CNN Fail"; }
    }
    else if (url.pathname === "/vix") resData.price = await fetchYahooV8("^VIX");
    else if (url.pathname === "/vixtw") {
      // 針對 VIXTW，如果 Yahoo 沒數據，嘗試從期交所官網爬取
      const yahooPrice = await fetchYahooV8("^VIXTW");
      if (yahooPrice) {
        resData.price = yahooPrice;
      } else {
        try {
          const res = await fetch("https://www.taifex.com.tw/cht/7/vixIndex", { headers: { "User-Agent": "Mozilla/5.0" } });
          const text = await res.text();
          // 用正規表達式尋找今日 VIX 指數
          const match = text.match(/<td class="first">(今日VIX指數|盤後VIX指數)<\/td>\s*<td[^>]*>([\d\.]+)<\/td>/);
          resData.price = match ? parseFloat(match[2]) : null;
        } catch (e) { resData.error = "VIXTW/Taifex Fail"; }
      }
    }
    else if (url.pathname === "/twd") {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const j = await res.json();
        resData.price = j.rates.TWD;
      } catch (e) { resData.error = "TWD Fail"; }
    }
    else if (url.pathname === "/7769") {
      try {
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
        const j = await res.json();
        resData.price = j.data?.pop()?.close;
      } catch (e) { resData.error = "7769 Fail"; }
    }

    return new Response(JSON.stringify(resData), { headers: corsHeaders });
  }
};
