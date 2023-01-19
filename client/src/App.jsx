import React, { useEffect, useState, useRef } from "react";
import "./index.css";

class Connection {
  retryCount = 0;
  maxRetryCount = 5;
  ws = null;

  constructor(config) {}

  open() {
    this.ws = new WebSocket("ws://localhost:8888/talk");

    this.ws.onopen = () => {
      this.ws.send("Hello Server!");
      this.retryCount = 0;
    };

    this.ws.onmessage = (msg) => {
      // console.log("msg", msg);
    };

    this.ws.onclose = (event) => {
      const { code, reason, wasClean } = event;
      console.error(
        `Connection closed, code: ${code}, reason: ${reason}, wasClean: ${wasClean}`
      );
      if (this.retryCount >= this.maxRetryCount) {
        console.error("unable to make a connection!");
      } else {
        this.retryCount += 1;
        // 这里不需要在建立新的 ws 连接前手动 `this.ws.close()`
        // 因为已经是 onclose 事件了，说明 ws 已经断掉了
        setTimeout(() => {
          this.open();
          console.log(`reconecting x ${this.retryCount}`);
        }, this.retryCount * 1000);
      }
    };

    this.ws.onerror = () => {
      console.error("ws connected error!");
    };
  }

  close() {
    this.ws.close();
  }
}
export default function App() {
  const [latestMsg, setLatestMsg] = useState("empty");
  let { current: connection } = useRef(null);

  useEffect(() => {
    connection = new Connection();
    connection.open();
    setInterval(() => connection.ws.send(123123), 5000);
  }, []);

  return (
    <div className="container">
      <div className="member-list"></div>
      <div className="chat-area">
        <div className="content">{latestMsg}</div>
        <input
          placeholder="input here"
          className="type-here"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              connection.ws.send(e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
}
