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
