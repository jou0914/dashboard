// api/yahoo.js — Vercel Serverless Function
// 抓取任意 Yahoo Finance 標的，回傳 price / change / closes[]
module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Cache-Control’, ‘s-maxage=180, stale-while-revalidate=300’);

const sym = req.query.sym;
if (!sym) return res.status(400).json({ error: ‘missing sym’ });

try {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=3mo`;
const r = await fetch(url, {
headers: { ‘User-Agent’: ‘Mozilla/5.0’, ‘Accept’: ‘application/json’ }
});
if (!r.ok) throw new Error(`yahoo ${r.status}`);
const data = await r.json();
const result = data.chart.result[0];
const closes = result.indicators.quote[0].close.filter(Boolean);
const price  = result.meta.regularMarketPrice ?? closes[closes.length-1];
const prev   = closes[closes.length-2] ?? price;
const change    = price - prev;
const changePct = (change / prev) * 100;

```
res.status(200).json({
  price:     parseFloat(price.toFixed(4)),
  change:    parseFloat(change.toFixed(4)),
  changePct: parseFloat(changePct.toFixed(2)),
  closes:    closes.slice(-60).map(v => parseFloat(v.toFixed(4))),
  updatedAt: new Date().toISOString(),
});
```

} catch (err) {
res.status(502).json({ error: err.message });
}
};
