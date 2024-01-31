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

  // 注册响应完成的回调函数
  res.on("finish", () => {
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
  });

  // 继续处理请求
  next();
};

module.exports = requestLogger;
