// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const config = require("../config");

let sessions = {}; // 用于存储客户端会话信息

const rateLimiter = (req, res, next) => {
  const maxRequestsPerMinute = config.rateLimiter.maxRequestsPerMinute || 100; // 每分钟最大请求数
  const timeWindowInMinutes = config.rateLimiter.timeWindowInMinutes || 1; // 时间窗口（分钟）

  const clientIp = req.ip; // 获取客户端 IP 地址作为会话标识

  // 创建新会话
  if (!clientIp) {
    return res.status(401).json({ message: "未授权" });
  }

  const session = sessions[clientIp];

  // 如果会话不存在或已过期，创建新会话
  if (!session || isSessionExpired(session, timeWindowInMinutes)) {
    sessions[clientIp] = {
      requests: [{ timestamp: Date.now() }],
    };
    return next();
  }

  const currentTime = Date.now();
  const windowStartTime = currentTime - timeWindowInMinutes * 60 * 1000;

  const requestsInWindow = session.requests.filter(
    (request) => request.timestamp >= windowStartTime
  );

  // 如果请求数超过限制
  if (requestsInWindow.length >= maxRequestsPerMinute) {
    const retryAfter = Math.ceil(
      (requestsInWindow[0].timestamp - windowStartTime) / 1000
    ); // 秒数
    res.set("Retry-After", retryAfter);
    return res
      .status(429)
      .json({ message: "在一定的时间内用户发送了太多的请求" });
  }

  // 记录当前请求
  session.requests.push({ timestamp: currentTime });

  // 继续处理请求
  next();
};

// 判断会话是否过期
function isSessionExpired(session, timeWindowInMinutes) {
  const currentTime = Date.now();
  const windowStartTime = currentTime - timeWindowInMinutes * 60 * 1000;
  return session.requests[0].timestamp < windowStartTime;
}

// 重置速率限制器状态
rateLimiter.reset = () => {
  sessions = {};
};

module.exports = rateLimiter;
