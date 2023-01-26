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
  port: 9876,
});

wss.on("connection", function (ws) {
  console.log(`[SERVER] connection()`);
  ws.on("message", function (message) {
    if (message.toString("utf8") === "hb") {
      ws.send("hb");
    } else {
      /** group chat
        * if you wants group chat, then use 
        * wss.clients getting all connected
        * clients to broadcast the message
       wss.clients.forEach((client) => {
         client.send(`echo: ${message}`);
       });
      **/
    
      // one on one chat
      ws.send(`echo: ${message}`);
    }
    // ws.ping("ping");
  });
  // ws.on("pong", (ping) => console.log(`ping received, ${ping}`));
});
