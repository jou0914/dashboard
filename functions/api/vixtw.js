// api/vixtw.js — Vercel Serverless Function (CommonJS)
// 抓取 FinMind VIXTW，逆向搜尋避免假日零值問題
module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Cache-Control’, ‘s-maxage=300, stale-while-revalidate=600’);

try {
const now = new Date();
const endDate   = new Date(now.getTime() + 8*3600000).toISOString().split(‘T’)[0];
const startDate = new Date(now.getTime() - 30*86400000).toISOString().split(‘T’)[0];

```
const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
const r = await fetch(url);
const result = await r.json();

if (!result.data || result.data.length === 0) {
  return res.status(404).json({ error: '無數據' });
}

// 逆向搜尋第一筆 close > 0 的有效值（避免假日零值）
let idx = -1;
for (let i = result.data.length - 1; i >= 0; i--) {
  if (parseFloat(result.data[i].close) > 0) { idx = i; break; }
}
if (idx < 1) return res.status(404).json({ error: '找不到有效交易日' });

const latest = result.data[idx];
const prev   = result.data[idx - 1];
const price     = parseFloat(latest.close);
const prevPrice = parseFloat(prev.close);
const change    = price - prevPrice;
const changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

res.status(200).json({
  status:    'success',
  price:     parseFloat(price.toFixed(2)),
  date:      latest.date,
  change:    parseFloat(change.toFixed(2)),
  changePct: parseFloat(changePct.toFixed(2)),
});
```

} catch (err) {
res.status(500).json({ error: err.message });
}
};
