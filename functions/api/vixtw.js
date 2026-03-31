// api/vixtw.js — Cloudflare Workers (ES Module format)
export default {
async fetch(request) {
const headers = {
‘Access-Control-Allow-Origin’: ‘*’,
‘Content-Type’: ‘application/json’,
‘Cache-Control’: ‘public, max-age=300’,
};

```
try {
  const now = new Date();
  const endDate   = new Date(now.getTime() + 8*3600000).toISOString().split('T')[0];
  const startDate = new Date(now.getTime() - 30*86400000).toISOString().split('T')[0];

  const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
  const r = await fetch(url);
  const result = await r.json();

  if (!result.data || result.data.length === 0) {
    return new Response(JSON.stringify({ error: '無數據' }), { status: 404, headers });
  }

  // 逆向搜尋第一筆 close > 0
  let idx = -1;
  for (let i = result.data.length - 1; i >= 0; i--) {
    if (parseFloat(result.data[i].close) > 0) { idx = i; break; }
  }
  if (idx < 1) return new Response(JSON.stringify({ error: '找不到有效交易日' }), { status: 404, headers });

  const latest    = result.data[idx];
  const prev      = result.data[idx - 1];
  const price     = parseFloat(latest.close);
  const prevPrice = parseFloat(prev.close);
  const change    = price - prevPrice;
  const changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

  return new Response(JSON.stringify({
    status:    'success',
    price:     +price.toFixed(2),
    date:      latest.date,
    change:    +change.toFixed(2),
    changePct: +changePct.toFixed(2),
  }), { headers });

} catch (err) {
  return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
}
```

}
};
