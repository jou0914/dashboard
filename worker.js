export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "no-store"
    };

    const cache = caches.default;

    const safeFetch = async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });
        if (!res.ok) throw new Error(res.status);
        return await res.json();
      } catch (e) {
        return { error: e.message };
      }
    };

    const handle = async () => {
      let data = { price: 0, change: 0, isUp: true };

      const path = new URL(request.url).pathname;

      // CNN
      if (path === "/cnn") {
        const j = await safeFetch("https://api.alternative.me/fng/");
        if (!j.error) {
          return {
            price: parseInt(j.data[0].value),
            label: j.data[0].value_classification
          };
        }
      }

      // Yahoo 即時
      if (["/vix", "/vixtw", "/twd"].includes(path)) {
        const sym =
          path === "/vix"
            ? "%5EVIX"
            : path === "/vixtw"
            ? "%5EVIXTW"
            : "TWD=X";

        const j = await safeFetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${sym}`
        );

        if (j.quoteResponse?.result?.[0]) {
          const r = j.quoteResponse.result[0];
          return {
            price: r.regularMarketPrice,
            change: r.regularMarketChangePercent || 0,
            isUp: (r.regularMarketChangePercent || 0) >= 0
          };
        }
      }

      // 股票（FinMind + fallback）
      if (path === "/7769") {
        const j = await safeFetch(
          "https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-20"
        );

        if (j.data?.length >= 2) {
          const last = j.data.at(-1);
          const prev = j.data.at(-2);
          const chg = ((last.close - prev.close) / prev.close) * 100;

          return {
            price: last.close,
            change: chg,
            isUp: chg >= 0
          };
        }
      }

      return { error: "No Data" };
    };

    // 🔥 Cloudflare Cache（30秒）
    const cacheKey = new Request(request.url);
    let response = await cache.match(cacheKey);

    if (!response) {
      const data = await handle();
      response = new Response(JSON.stringify(data), {
        headers: corsHeaders
      });

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  }
};
