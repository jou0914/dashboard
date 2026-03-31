export class VixSocket {
  constructor(state, env) {
    this.state = state;
    this.clients = new Set();

    // 每10秒抓一次資料
    this.startTicker();
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Not WebSocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  handleSession(ws) {
    ws.accept();
    this.clients.add(ws);

    ws.addEventListener("close", () => {
      this.clients.delete(ws);
    });
  }

  async startTicker() {
    setInterval(async () => {
      try {
        const res = await fetch(
          "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1m&range=1d"
        );
        const json = await res.json();

        const closes = json.chart.result[0].indicators.quote[0].close;

        let price = null;
        for (let i = closes.length - 1; i >= 0; i--) {
          if (closes[i] !== null) {
            price = closes[i];
            break;
          }
        }

        if (!price) return;

        const data = JSON.stringify({
          type: "vix",
          price: price,
          time: new Date().toLocaleTimeString()
        });

        // 🔥 推播給所有人
        this.clients.forEach(c => c.send(data));

      } catch (e) {
        console.log("fetch error");
      }
    }, 10000); // 每10秒
  }
}
