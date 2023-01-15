import React, { useEffect, useState, useRef } from "react";
import "./index.css";

export default function App() {
  const [latestMsg, setLatestMsg] = useState("empty");
  const { current: ws } = useRef(new WebSocket("ws://localhost:8888"));
  useEffect(() => {
    ws.onopen = function (msg) {
      ws.send("Hello Server!");
    };

    ws.onmessage = function (msg) {
      setLatestMsg(msg.data);
    };
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
              ws.send(e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
}
