const express = require("express");
const app = express();
const PORT = 4000;

const cors = require("cors");

app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "Hello world",
  });
});

const httpServer = require("http").Server(app);
httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// FIXME: 刷新页面就直接变成新的用户了
// const WebSocket = require("ws");
const { WebSocketServer } = require("ws");
const { createServer } = require("http");

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", function upgrade(request, socket, head) {
  console.log(request.url);
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
});
server.listen(9876);

const servicer = [];
const customer = [];
// TODO: customer to servicer
wss.on("connection", function (ws, request) {
  console.log(`[SERVER] connection()`, request.url);
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
