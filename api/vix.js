// api/vix.js
// Vercel Serverless Function — 中轉 Yahoo Finance VIX 數據
// 放到專案根目錄的 /api/vix.js 即可，Vercel 自動部署為 /api/vix

export default async function handler(req, res) {
// CORS headers — 允許你的 dashboard domain 呼叫
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET, OPTIONS’);
res.setHeader(‘Cache-Control’, ‘s-maxage=300, stale-while-revalidate=600’); // 快取 5 分鐘

if (req.method === ‘OPTIONS’) {
res.status(200).end();
return;
}

try {
const url = ‘https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=10d’;
const response = await fetch(url, {
headers: {
‘User-Agent’: ‘Mozilla/5.0 (compatible; dashboard/1.0)’,
‘Accept’: ‘application/json’,
},
});

```
if (!response.ok) {
  throw new Error(`Yahoo Finance responded ${response.status}`);
}

const data = await response.json();
const result = data.chart.result[0];
const closes = result.indicators.quote[0].close.filter(Boolean);
const price = result.meta.regularMarketPrice ?? closes[closes.length - 1];
const prev  = closes[closes.length - 2] ?? price;
const change = price - prev;
const changePct = (change / prev) * 100;

res.status(200).json({
  price:     parseFloat(price.toFixed(2)),
  change:    parseFloat(change.toFixed(2)),
  changePct: parseFloat(changePct.toFixed(2)),
  updatedAt: new Date().toISOString(),
});
```

} catch (err) {
res.status(502).json({ error: err.message });
}
}
