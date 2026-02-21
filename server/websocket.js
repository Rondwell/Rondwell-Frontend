const { WebSocketServer } = require("ws");

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "connected", message: "WebSocket connected" }));

    socket.on("message", (raw) => {
      const message = raw.toString();

      for (const client of wss.clients) {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "broadcast", message }));
        }
      }
    });
  });

  return wss;
}

module.exports = { setupWebSocket };
