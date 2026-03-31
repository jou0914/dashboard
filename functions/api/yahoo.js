export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const sym = searchParams.get('sym');
  const headers = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  if (!sym) return new Response(JSON.stringify({error:'missing sym'}),{status:400,headers});
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(sym)+'?interval=1d&range=3mo',
      {headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
    const text = await r.text();
    if (!r.ok) return new Response(JSON.stringify({error:'yahoo_'+r.status,body:text.slice(0,200)}),{status:502,headers});
    const data = JSON.parse(text);
    const result = data.chart.result[0];
    const closes = result.indicators.quote[0].close.filter(v=>v!=null);
    const price = result.meta.regularMarketPrice||closes[closes.length-1];
    const prev = closes[closes.length-2]||price;
    const change = price-prev, changePct = prev?(change/prev*100):0;
    return new Response(JSON.stringify({
      price:+price.toFixed(4),change:+change.toFixed(4),changePct:+changePct.toFixed(2),
      closes:closes.slice(-60).map(v=>+v.toFixed(4)),updatedAt:new Date().toISOString()
    }),{headers});
  } catch(err){return new Response(JSON.stringify({error:err.message}),{status:500,headers});}
}
