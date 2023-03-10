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

  return retryAfter;
};

// FIXME: emit/sub
class Connection {
  retryCount = 0;
  ws = null;
  keepAliveTimer = null;
  timeoutTimer = null;
  reconnectingTimer = null;

  constructor(config = {}) {
    this.config = {
      maxRetryCount: 5,
      ...config,
    };
  }

  clearTimers() {
    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = null;
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
    // 如果还没有重连就被清掉的话
    if (this.reconnectingTimer) {
      this.retryCount -= 1;
    }
    clearTimeout(this.reconnectingTimer);
    this.reconnectingTimer = null;
  }

  reset() {
    this.retryCount = 0;
    this.ws = null;
    this.clearTimers();
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

  open(onmessage) {
    this.ws = new WebSocket(`ws://localhost:9876/talk${location.search}`);
    console.log("open() called");
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
        onmessage(data.toString());
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
      this.reconnect();
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
    const retryAfter = calculateReconnectTime(this.retryCount);
    this.reconnectingTimer = setTimeout(() => {
      console.log(`reconecting x ${this.retryCount}, ${retryAfter}s passed.`);
      this.open();
      this.reconnectingTimer = null;
    }, retryAfter);
  }

  close() {
    this.ws.close(1000);
    // 因为异步的所以不能再这里调用 `this.reset`
  }
}
export default function App() {
  const [latestMsg, setLatestMsg] = useState("empty");
  // NOTE: { current: connection } = useRef(null) 不行
  const connection = useRef(null);

  useEffect(() => {
    connection.current = new Connection();
    connection.current.open(setLatestMsg);
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
              if (!connection.current) return;
              connection.current.ws.send(e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
}
