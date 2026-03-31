// worker.js — Cloudflare Workers 主入口
// 路由：/api/yahoo, /api/vix, /api/vixtw → 各自處理
// 其他 → 回傳靜態檔案

export default {
async fetch(request, env, ctx) {
const url = new URL(request.url);
const path = url.pathname;

```
// ── /api/yahoo?sym=XXX ──
if (path === '/api/yahoo') {
  const sym = url.searchParams.get('sym');
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json', 'Cache-Control':'public,max-age=180' };
  if (!sym) return new Response(JSON.stringify({error:'missing sym'}), {status:400,headers});
  try {
    const r = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=3mo',
      { headers: { 'User-Agent':'Mozilla/5.0', 'Accept':'application/json' } }
    );
    const text = await r.text();
    if (!r.ok) return new Response(JSON.stringify({error:'yahoo_'+r.status,body:text.slice(0,200)}),{status:502,headers});
    const data = JSON.parse(text);
    const result = data.chart.result[0];
    const closes = result.indicators.quote[0].close.filter(v=>v!=null);
    const price  = result.meta.regularMarketPrice || closes[closes.length-1];
    const prev   = closes[closes.length-2] || price;
    const change = price-prev, changePct = prev?(change/prev*100):0;
    return new Response(JSON.stringify({
      price:+price.toFixed(4), change:+change.toFixed(4), changePct:+changePct.toFixed(2),
      closes:closes.slice(-60).map(v=>+v.toFixed(4)), updatedAt:new Date().toISOString()
    }), {headers});
  } catch(err) { return new Response(JSON.stringify({error:err.message}),{status:500,headers}); }
}

// ── /api/vix ──
if (path === '/api/vix') {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json', 'Cache-Control':'public,max-age=300' };
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=10d',
      { headers: { 'User-Agent':'Mozilla/5.0', 'Accept':'application/json' } });
    if (!r.ok) throw new Error('yahoo_'+r.status);
    const data = await r.json();
    const result = data.chart.result[0];
    const closes = result.indicators.quote[0].close.filter(v=>v!=null);
    const price  = result.meta.regularMarketPrice || closes[closes.length-1];
    const prev   = closes[closes.length-2] || price;
    const change = price-prev;
    return new Response(JSON.stringify({
      price:+price.toFixed(2), change:+change.toFixed(2), changePct:+(change/prev*100).toFixed(2),
      updatedAt:new Date().toISOString()
    }), {headers});
  } catch(err) { return new Response(JSON.stringify({error:err.message}),{status:502,headers}); }
}

// ── /api/vixtw ──
if (path === '/api/vixtw') {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json', 'Cache-Control':'public,max-age=300' };
  try {
    const now = new Date();
    const endDate   = new Date(now.getTime()+8*3600000).toISOString().split('T')[0];
    const startDate = new Date(now.getTime()-30*86400000).toISOString().split('T')[0];
    const r = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`);
    const result = await r.json();
    if (!result.data||result.data.length===0) return new Response(JSON.stringify({error:'無數據'}),{status:404,headers});
    let idx=-1;
    for (let i=result.data.length-1;i>=0;i--) { if (parseFloat(result.data[i].close)>0){idx=i;break;} }
    if (idx<1) return new Response(JSON.stringify({error:'找不到有效交易日'}),{status:404,headers});
    const latest=result.data[idx], prev=result.data[idx-1];
    const price=parseFloat(latest.close), prevPrice=parseFloat(prev.close);
    const change=price-prevPrice, changePct=prevPrice?(change/prevPrice*100):0;
    return new Response(JSON.stringify({
      status:'success', price:+price.toFixed(2), date:latest.date,
      change:+change.toFixed(2), changePct:+changePct.toFixed(2)
    }), {headers});
  } catch(err) { return new Response(JSON.stringify({error:err.message}),{status:500,headers}); }
}

// ── 靜態資產 fallback → 回傳 index.html ──
return env.ASSETS.fetch(request);
```

}
};
