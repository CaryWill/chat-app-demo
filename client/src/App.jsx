import React, { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // 打开一个WebSocket:
    var ws = new WebSocket("ws://localhost:8888/im");
    // 响应onmessage事件:
    ws.onmessage = function (msg) {
      console.log(msg);
    };
    // 给服务器发送一个字符串:
    setTimeout(() => {
      ws.send("Hello!");
    }, 1000);
  }, []);
  return (
    <div>
      <p>Hello World!</p>
    </div>
  );
}
