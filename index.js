export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // WebSocket 入口
    if (url.pathname === "/ws") {
      const id = env.VIX_SOCKET.idFromName("vix-room");
      const obj = env.VIX_SOCKET.get(id);
      return obj.fetch(request);
    }

    return new Response("OK");
  }
};
