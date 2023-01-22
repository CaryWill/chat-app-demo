import React, { useEffect, useState, useRef } from "react";
import "./index.css";

// `ws.close()` 默认返回的是 1005
const NORMAL_CLOSE_CODE = 1000;
// 默认消息发送的超时时间，超过 5 秒无响应则认为失败
const SEND_FAIL_TIMEOUT = 5 * 1000;

// 重连时间需要动态计算以免所有 clients 同时重连对后端进行了 DDos
const calculateReconnectTime = (reconnectCount) => {
  // 如果请求失败，等待 1 + random_number_milliseconds 秒之后再重试请求。
  // 如果请求失败，等待 2 + random_number_milliseconds 秒之后再重试请求。
  // 如果请求失败，等待 4 + random_number_milliseconds 秒之后再重试请求。
  // 依此类推，等待时间的上限为 maximum_backoff。
  const randomNumberMilliseconds = Math.random() * 1000;
  const retryAfter = Math.min(
    2 ** (reconnectCount - 1) * 1000 + randomNumberMilliseconds,
    5000 + randomNumberMilliseconds
  );

  console.log("retry after", retryAfter);
  return retryAfter;
};

class Connection {
  retryCount = 0;
  ws = null;
  keepAliveTimer = null;
  timeoutTimer = null;
  config = {
    maxRetryCount: 5,
  };

  reset() {
    this.retryCount = 0;
    this.ws = null;
    this.clearTimers();
  }

  clearTimers() {
    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = null;
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
  }

  keepAlive() {
    this.keepAliveTimer = setInterval(() => {
      this.ws.send("hb");
      this.timeoutTimer = setTimeout(() => {
        // 默认 5s 没有就关闭重连
        console.log("initalt close");
        this.ws.close();
      }, SEND_FAIL_TIMEOUT);
    }, 6000);
  }

  open() {
    this.ws = new WebSocket("ws://localhost:9876/talk");
    this.ws.onopen = () => {
      this.ws.send("open");
      // 重连/连接成功了，重置重连相关配置
      this.retryCount = 0;
      this.keepAlive();
    };

    this.ws.onmessage = (msg) => {
      const { data } = msg;
      if (data === "hb") {
        if (this.timeoutTimer !== null) clearTimeout(this.timeoutTimer);
      } else {
        console.log(msg);
      }
    };

    this.ws.onclose = (event) => {
      const { code, reason, wasClean } = event;
      console.error(`Connection closed, code: ${code}`);
      // 正常断开
      if (code === NORMAL_CLOSE_CODE) {
        console.log("normal close");
        this.reset();
      } else {
        return this.reconnect();
      }
    };

    this.ws.onerror = () => {
      console.error("ws connected error!");
      // this.reconnect();
    };
  }

  // 需要加锁，onerror 和 onclose 都触发的话需要加一个锁，
  // 只需要保证执行了一次断线重连即可
  reconnect() {
    this.clearTimers();
    if (this.retryCount >= this.config.maxRetryCount) {
      // 不再重连
      console.error("unable to make a connection!");
      return this.close();
    }
    this.retryCount += 1;
    // 这里不需要在建立新的 ws 连接前手动 `this.ws.close()`
    // 因为已经是 onclose 事件了，说明 ws 已经断掉了
    setTimeout(() => {
      console.log(`reconecting x ${this.retryCount}`);
      this.open();
    }, calculateReconnectTime(this.retryCount));
  }

  close() {
    this.ws.close(1000);
    // 因为异步的所以不能再这里调用 `this.reset`
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
