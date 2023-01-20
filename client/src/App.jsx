import React, { useEffect, useState, useRef } from "react";
import "./index.css";

// `ws.close()` 默认返回的是 1005
const NORMAL_CLOSE_CODE = 1000;
// 默认消息发送的超时时间，超过 5 秒无响应则认为失败
const SEND_FAIL_TIMEOUT = 5 * 1000;

class Connection {
  retryCount = 0;
  maxRetryCount = 5;
  ws = null;
  isClosedBySelf = false;
  keepAliveTimer = null;
  timeoutTimer = null;

  constructor(config) {}

  reset() {
    // TODO: 抽离到一个对象方便直接 reset
    this.retryCount = 0;
    this.ws = null;
    this.isClosedBySelf = false;
    this.keepAliveTimer = null;
    this.timeoutTimer = null;
  }

  keepAlive() {
    if (this.keepAliveTimer === null) {
      this.keepAliveTimer = setInterval(() => {
        this.ws.send("hb");
        this.timeoutTimer = setTimeout(() => {
          // 默认 5s 没有就关闭重连
          this.ws.close();
        }, SEND_FAIL_TIMEOUT);
      }, 6000);
    } else {
      clearInterval(this.keepAliveTimer);
    }
  }

  open() {
    this.ws = new WebSocket("ws://localhost:9876/talk");
    this.ws.onopen = () => {
      this.ws.send("open");
      this.retryCount = 0;
      this.keepAlive();
    };

    this.ws.onmessage = (msg) => {
      const { data } = msg;
      if (data === "hb") {
        console.log(msg, typeof msg, "test");
        if (this.timeoutTimer !== null) clearTimeout(this.timeoutTimer);
      }
    };

    this.ws.onclose = (event) => {
      const { code, reason, wasClean } = event;
      console.error(
        `Connection closed, code: ${code}, reason: ${reason}, wasClean: ${wasClean}`
      );
      if (this.retryCount >= this.maxRetryCount) {
        console.error("unable to make a connection!");
      } else {
        if (code === NORMAL_CLOSE_CODE || this.isClosedBySelf) {
          // 正常断开
          return this.reset();
        }
        // TODO: 重连要不要加一个锁
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
    this.ws.close(1000);
    this.isClosedBySelf = true;
  }
}
export default function App() {
  const [latestMsg, setLatestMsg] = useState("empty");
  let { current: connection } = useRef(null);

  useEffect(() => {
    connection = new Connection();
    connection.open();
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
