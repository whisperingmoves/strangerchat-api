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

const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const https = require("https");
const fs = require("fs");
const socketIo = require("socket.io");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const config = require("./config");
const routes = require("./routes");
const Post = require("./models/Post");
const User = require("./models/User");
const errorMiddleware = require("./middlewares/error");
const notFoundMiddleware = require("./middlewares/notFound");
const socketAuthMiddleware = require("./middlewares/socketAuth");
const requestLoggerMiddleware = require("./middlewares/requestLogger");
const socketLoggerMiddleware = require("./middlewares/socketLogger");
const rateLimiterMiddleware = require("./middlewares/rateLimiter");
const sockets = require("./sockets");
const ErrorMonitorService = require("./services/ErrorMonitorService");

// 模块定义
const swaggerDocument = YAML.load("./docs/openapi.yaml");
const userIdSocketMap = {};

const app = express();

// 实例化 ErrorMonitoringService 并设置启动时间
const errorMonitoringService = ErrorMonitorService.getInstance();
errorMonitoringService.setAppStartTime(new Date());

let server;

if (config.ssl.on === "on") {
  // 读取 SSL 证书和私钥文件
  const privateKey = fs.readFileSync(config.ssl.privateKeyPath, "utf8");
  const certificate = fs.readFileSync(config.ssl.certificatePath, "utf8");

  const credentials = { key: privateKey, cert: certificate };

  // 创建 HTTPS 服务器
  server = https.createServer(credentials, app);
} else {
  // 创建 HTTP 服务器
  server = http.createServer(app);
}

const io = socketIo(server);

app.set("io", io);
app.set("userIdSocketMap", userIdSocketMap);

mongoose.connect(config.dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 在连接成功时创建地理索引
mongoose.connection.once("open", async () => {
  try {
    // 创建用户模型的地理索引
    await User.createIndexes({ location: "2dsphere" });
    // 创建帖子模型的地理索引
    await Post.createIndexes({ location: "2dsphere" });
    console.log("地理索引创建成功！");
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("创建地理索引时出错：", error);
  }
});

// 路由定义
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(requestLoggerMiddleware);
app.use(rateLimiterMiddleware);

// 静态文件服务
app.use("/public", express.static(__dirname + "/public"));

app.use(routes);

// 404 中间件
app.use(notFoundMiddleware);

app.use(errorMiddleware);

// socket.io鉴权
io.use(socketAuthMiddleware);

// socket.io日志
io.use(socketLoggerMiddleware);

// socket.io控制器
io.on("connect", (socket) => {
  sockets(io, socket, userIdSocketMap);
});

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}...`);
});

// 捕捉未经处理的同步异常
process.on("uncaughtException", (error) => {
  errorMonitoringService.monitorError(error).then();
  console.error("Uncaught Exception:", error);
  process.exit(1); // 终止进程
});

// 捕捉未经处理的异步异常
process.on("unhandledRejection", (error) => {
  errorMonitoringService.monitorError(error).then();
  console.error("Unhandled Rejection:", error);
  process.exit(1); // 终止进程
});

module.exports = app;
