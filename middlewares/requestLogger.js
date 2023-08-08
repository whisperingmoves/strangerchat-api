const requestLogger = (req, res, next) => {
  const start = new Date();

  // 检查环境变量的值
  if (process.env.NODE_ENV !== "test") {
    // 打印请求信息
    console.log("--- Request ---");
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
  }

  // 继续处理请求
  next();

  // 计算响应耗时
  const end = new Date();
  const duration = end - start;

  // 检查环境变量的值
  if (process.env.NODE_ENV !== "test") {
    // 打印响应信息
    console.log("--- Response ---");
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.getHeaders());
    console.log("Duration:", duration, "ms");
  }
};

module.exports = requestLogger;
