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
