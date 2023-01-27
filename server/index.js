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
const { isServicer } = require("./utils");

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
});
server.listen(9876);

const servicers = [];
const customers = [];
// TODO: customer to servicer
// TODO: destroy when page leaving
const mapping = new Map();
wss.on("connection", function (ws, request) {
  // TOOD: 鉴权
  const isCustomer = !isServicer(request.url);
  if (isCustomer) {
    customers.push(ws);
    const servicer = servicers.shift();
    mapping.set(ws, servicer);
    mapping.set(servicer, ws);
    if (!servicer) {
      // 没有坐席在线就不让转人工
      return ws.close();
    }
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
        // FIXME: 中间人功能（监听) loop servicers
        servicer.send(`${message.toString("utf8")}`);
      }
    });
    // TODO: 结束会话后清楚两者的联系
    ws.on("close", function () {
      // mapping.delete(ws);
      // mapping.delete(servicer);
    });
  } else {
    servicers.push(ws);
    ws.on("message", function (message) {
      if (message.toString("utf8") === "hb") {
        ws.send("hb");
      } else {
        console.log(message.toString());
        const customer = mapping.get(ws);
        if (!customer) return;
        customer.send(`${message.toString("utf8")}`);
      }
      // ws.ping("ping");
    });
  }
  // ws.on("pong", (ping) => console.log(`ping received, ${ping}`));
});
