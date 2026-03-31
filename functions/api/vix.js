// api/vix.js — Cloudflare Workers (ES Module format)
export default {
async fetch(request) {
const headers = {
‘Access-Control-Allow-Origin’: ‘*’,
‘Content-Type’: ‘application/json’,
‘Cache-Control’: ‘public, max-age=300’,
};

```
try {
  const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=10d', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });

  if (!r.ok) throw new Error('yahoo_' + r.status);
  const data = await r.json();
  const result = data.chart.result[0];
  const closes = result.indicators.quote[0].close.filter(v => v != null);
  const price  = result.meta.regularMarketPrice || closes[closes.length - 1];
  const prev   = closes[closes.length - 2] || price;
  const change = price - prev;

  return new Response(JSON.stringify({
    price:     +price.toFixed(2),
    change:    +change.toFixed(2),
    changePct: +(change / prev * 100).toFixed(2),
    updatedAt: new Date().toISOString(),
  }), { headers });

} catch (err) {
  return new Response(JSON.stringify({ error: err.message }), { status: 502, headers });
}
```

}
};
