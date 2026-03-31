// functions/api/vixtw.js — Cloudflare Pages Functions
export async function onRequest(context) {
const headers = {
‘Access-Control-Allow-Origin’: ‘*’,
‘Content-Type’: ‘application/json’,
‘Cache-Control’: ‘public, max-age=300’,
};

try {
const now = new Date();
const endDate   = new Date(now.getTime() + 8*3600000).toISOString().split(‘T’)[0];
const startDate = new Date(now.getTime() - 30*86400000).toISOString().split(‘T’)[0];

```
const r = await fetch(
  `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`
);
const result = await r.json();
if (!result.data || result.data.length === 0)
  return new Response(JSON.stringify({ error: '無數據' }), { status: 404, headers });

let idx = -1;
for (let i = result.data.length-1; i >= 0; i--) {
  if (parseFloat(result.data[i].close) > 0) { idx = i; break; }
}
if (idx < 1) return new Response(JSON.stringify({ error: '找不到有效交易日' }), { status: 404, headers });

const latest = result.data[idx], prev = result.data[idx-1];
const price = parseFloat(latest.close), prevPrice = parseFloat(prev.close);
const change = price - prevPrice;
const changePct = prevPrice ? (change/prevPrice*100) : 0;

return new Response(JSON.stringify({
  status: 'success',
  price:     +price.toFixed(2),
  date:      latest.date,
  change:    +change.toFixed(2),
  changePct: +changePct.toFixed(2),
}), { headers });
```

} catch(err) {
return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
}
}
