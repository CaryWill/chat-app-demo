const express = require("express");
const app = express();
const PORT = 4000;

const http = require("http").Server(app);
const cors = require("cors");

app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "Hello world",
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// FIXME: 刷新页面就直接变成新的用户了
const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({
  port: 8888,
});

wss.on("connection", function (ws) {
  console.log(`[SERVER] connection()`);
  ws.on("message", function (message) {
    console.log(`[SERVER] Received: ${message}`);
    ws.send(`ECHO: ${message}`, (err) => {
      if (err) {
        console.log(`[SERVER] error: ${err}`);
      }
    });
  });
});
