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

const os = require("os");
const Intl = require("intl");
const ErrorMonitor = require("../models/ErrorMonitor");
const packageJson = require("../package.json");

class ErrorMonitoringService {
  constructor() {
    this.appStartTime = null;
  }

  static getInstance() {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  setAppStartTime(appStartTime) {
    this.appStartTime = appStartTime;
  }

  async monitorError(error) {
    try {
      // 从错误对象中获取相关属性
      const { message, stack } = error;

      // 从上下文中获取其他属性
      const projectName = packageJson.name;
      const appVersion = packageJson.version;
      const {
        ipAddress,
        runtimeName,
        runtimeVersion,
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
      } = getContext(error);

      // 检查是否传入了appStartTime，如果没有则使用实例的appStartTime属性
      const appStartTime = this.appStartTime || new Date();

      // 创建错误日志对象
      const errorLog = new ErrorMonitor({
        projectName,
        errorMessage: message,
        stackTrace: stack,
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
    } catch (err) {
      console.error(err);
    }
  }
}

ErrorMonitoringService.instance = null;

// 获取上下文信息
function getContext(error) {
  const ipAddress = getIpAddress(); // 获取客户端 IP 地址
  const runtimeName = getCurrentRuntimeName(); // 获取当前运行时环境的名称
  const runtimeVersion = getCurrentRuntimeVersion(); // 获取当前运行时环境的版本
  const appMemory = getCurrentAppMemoryUsage(); // 获取当前应用程序的内存使用量
  const browserName = getCurrentBrowserName(); // 获取客户端浏览器的名称
  const browserVersion = getCurrentBrowserVersion(); // 获取客户端浏览器的版本
  const locale = getCurrentLocale(); // 获取客户端的语言设置
  const timezone = getCurrentTimezone(); // 获取客户端的时区设置
  const operatingSystemName = getCurrentOperatingSystemName(); // 获取客户端操作系统的名称
  const operatingSystemVersion = getCurrentOperatingSystemVersion(); // 获取客户端操作系统的版本
  const occurredFile = getOccurredFile(error); // 获取错误发生的文件
  const occurredLine = getOccurredLine(error); // 获取错误发生的行号
  const occurredFunction = getOccurredFunction(error); // 获取错误发生的函数名

  return {
    ipAddress,
    runtimeName,
    runtimeVersion,
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
  };
}

function getIpAddress() {
  const interfaces = os.networkInterfaces();

  // 遍历网络接口
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];

    // 遍历接口信息
    for (const i of interfaceInfo) {
      // 筛选 IPv4 地址，排除回环地址和非内网地址
      if (
        i.family === "IPv4" &&
        !i.internal &&
        !isPrivateIpAddress(i.address)
      ) {
        return i.address;
      }
    }
  }

  return "N/A"; // 如果未找到合适的 IP 地址，返回默认值
}

// 检查是否为内网地址
function isPrivateIpAddress(ipAddress) {
  return (
    ipAddress.startsWith("10.") ||
    ipAddress.startsWith("172.16.") ||
    ipAddress.startsWith("192.168.")
  );
}

function getCurrentRuntimeName() {
  return process.release.name || "N/A"; // 如果无法获取运行时环境名称，则返回默认值 'N/A'
}

function getCurrentRuntimeVersion() {
  return process.version || "N/A"; // 如果无法获取运行时环境版本，则返回默认值 'N/A'
}

function getCurrentAppMemoryUsage() {
  const memoryUsage = process.memoryUsage();

  const usedMemory = formatMemorySize(memoryUsage.heapUsed);

  return parseFloat(usedMemory.toFixed(2)); // 返回当前应用程序的内存使用量（MB）
}

function formatMemorySize(bytes) {
  const kilobytes = bytes / 1024;
  return kilobytes / 1024;
}

function getCurrentBrowserName() {
  return "N/A";
}

function getCurrentBrowserVersion() {
  return "N/A";
}

function getCurrentLocale() {
  return (
    process.env.LANG ||
    process.env.LANGUAGE ||
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    "N/A"
  );
}

function getCurrentTimezone() {
  const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone || "N/A";
}

function getCurrentOperatingSystemName() {
  return os.platform() || "N/A"; // 如果无法获取操作系统名称，则返回默认值 'N/A'
}

function getCurrentOperatingSystemVersion() {
  return os.release() || "N/A"; // 如果无法获取操作系统版本，则返回默认值 'N/A'
}

function getOccurredFile(error) {
  const stack = error.stack;
  if (stack) {
    const stackLines = stack.split("\n");
    // 解析堆栈信息，找到包含文件路径的行
    for (let i = 1; i < stackLines.length; i++) {
      const line = stackLines[i].trim();
      if (line.startsWith("at")) {
        const filePath = extractFilePath(line);
        if (filePath) {
          return filePath;
        }
      }
    }
  }
  return "N/A"; // 如果无法获取错误发生的文件，则返回默认值 'N/A'
}

function extractFilePath(line) {
  const filePathRegex = /\((.*):\d+:\d+\)$/;
  const match = filePathRegex.exec(line);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function getOccurredLine(error) {
  const stack = error.stack;
  if (stack) {
    const stackLines = stack.split("\n");
    // 解析堆栈信息，找到包含行号的行
    for (let i = 1; i < stackLines.length; i++) {
      const line = stackLines[i].trim();
      if (line.startsWith("at")) {
        const lineNumber = extractLineNumber(line);
        if (lineNumber !== null && !isNaN(lineNumber)) {
          // 确保行号是数字类型
          return parseInt(lineNumber);
        }
      }
    }
  }
  return -1; // 如果无法获取错误发生的行号，则返回默认值 -1
}

function extractLineNumber(line) {
  const lineNumberRegex = /:(\d+):\d+$/;
  const match = lineNumberRegex.exec(line);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function getOccurredFunction(error) {
  const stack = error.stack;
  if (stack) {
    const stackLines = stack.split("\n");
    // 解析堆栈信息，找到包含函数名的行
    for (let i = 1; i < stackLines.length; i++) {
      const line = stackLines[i].trim();
      if (line.startsWith("at")) {
        const functionName = extractFunctionName(line);
        if (functionName) {
          return functionName;
        }
      }
    }
  }
  return "N/A"; // 如果无法获取错误发生的函数名，则返回默认值 'N/A'
}

function extractFunctionName(line) {
  const functionNameRegex = /at\s+([^\s]+)/;
  const match = functionNameRegex.exec(line);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

module.exports = ErrorMonitoringService;
