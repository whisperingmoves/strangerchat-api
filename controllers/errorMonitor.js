const ErrorMonitor = require("../models/ErrorMonitor");

const monitorError = async (req, res, next) => {
  const {
    projectName,
    errorMessage,
    stackTrace,
    appVersion,
    ipAddress,
    runtimeName,
    runtimeVersion,
    appStartTime,
    appMemory,
    browserName,
    browserVersion,
    locale,
    timezone,
    operatingSystemName,
    operatingSystemVersion,
    occurredFile,
    occurredLine,
    occurredFunction,
  } = req.body;

  try {
    // 检查必需参数是否存在
    if (!projectName || !errorMessage || !stackTrace) {
      return res.status(400).json({ message: "缺少必需的参数" });
    }

    // 创建错误日志对象
    const errorLog = new ErrorMonitor({
      projectName,
      errorMessage,
      stackTrace,
      appVersion,
      ipAddress,
      runtimeName,
      runtimeVersion,
      appStartTime,
      appMemory,
      browserName,
      browserVersion,
      locale,
      timezone,
      operatingSystemName,
      operatingSystemVersion,
      occurredFile,
      occurredLine,
      occurredFunction,
    });

    // 保存错误日志
    await errorLog.save();

    res.json({ message: "错误日志已记录" });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

module.exports = {
  monitorError,
};
