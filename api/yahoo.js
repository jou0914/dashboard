// api/yahoo.js
module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Cache-Control’, ‘s-maxage=180, stale-while-revalidate=300’);

const sym = req.query.sym;
if (!sym) return res.status(400).json({ error: ‘missing sym param’ });

try {
const url = ‘https://query1.finance.yahoo.com/v8/finance/chart/’ +
encodeURIComponent(sym) +
‘?interval=1d&range=3mo’;

```
const r = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  }
});

const text = await r.text();
if (!r.ok) return res.status(502).json({ error: 'yahoo_' + r.status, body: text.slice(0, 200) });

const data = JSON.parse(text);
const result = data.chart.result[0];
const closes = result.indicators.quote[0].close.filter(v => v != null);
const price  = result.meta.regularMarketPrice || closes[closes.length - 1];
const prev   = closes[closes.length - 2] || price;
const change    = price - prev;
const changePct = prev ? (change / prev) * 100 : 0;

return res.status(200).json({
  price:     +price.toFixed(4),
  change:    +change.toFixed(4),
  changePct: +changePct.toFixed(2),
  closes:    closes.slice(-60).map(v => +v.toFixed(4)),
  updatedAt: new Date().toISOString(),
});
```

} catch (err) {
return res.status(500).json({ error: err.message });
}
};
