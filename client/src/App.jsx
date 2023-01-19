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
      if (this.retryCount >= this.maxRetryCount) {
        console.error("unable to make a connection!");
      } else {
        this.retryCount += 1;
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
