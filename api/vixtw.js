export default async function handler(req, res) {
  try {
    const url = "https://corsproxy.io/?https://www.taifex.com.tw/file/taifex/CHINESE/3/vixDaily.csv";

    const response = await fetch(url);
    let text = await response.text();

    text = text.replace(/^\uFEFF/, "");

    const rows = text.split(/\r?\n/);

    const parsed = rows
      .slice(1)
      .map(r => r.trim())
      .filter(Boolean)
      .map(r => {
        const [date, raw] = r.split(",");
        const price = parseFloat((raw || "").replace(/[^0-9.]/g, ""));
        return { date, price };
      })
      .filter(d => d.date && d.price);

    if (parsed.length < 2) {
      return res.status(200).json({
        price: 0,
        status: "無有效資料",
      });
    }

    const latest = parsed.at(-1);
    const prev = parsed.at(-2);

    res.status(200).json({
      price: latest.price,
      change: latest.price - prev.price,
      changePct: ((latest.price - prev.price) / prev.price) * 100,
      date: latest.date,
      status: "success",
    });

  } catch (error) {
    res.status(200).json({
      error: error.message,
    });
  }
}
