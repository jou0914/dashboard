async function fetchVIXTW() {
    try {
        // 因為都在同一個 Cloudflare Worker 下，使用相對路徑即可
        const response = await fetch('/api/vixtw');
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        if (data.status === "success") {
            const price = data.price;
            const status = getVixStatus(price);
            
            document.getElementById('vixtw-num').textContent = price.toFixed(2);
            document.getElementById('vixtw-num').style.color = status.col;
            document.getElementById('vixtw-status').textContent = status.lbl;
            document.getElementById('vixtw-status').style.color = status.col;
            
            // 指針位置 (VIX 10~40 區間)
            const pos = Math.min(Math.max((price - 10) / 30 * 100, 0), 100);
            document.getElementById('vixtw-needle').style.left = pos + '%';
        }
    } catch (e) {
        document.getElementById('vixtw-status').textContent = "等待有效數據";
        document.getElementById('vixtw-status').style.color = "var(--text-muted)";
    }
}
