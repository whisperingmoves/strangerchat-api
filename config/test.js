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

module.exports = {
  env: "test",
  port: 3001,
  dbUrl: "mongodb://localhost:27018/chat_test",
  monitorDbUrl: "mongodb://localhost:27018/monitor_test",
  verifyCodeExpires: 60,
  avatarUploadPath: "./public/uploads/avatars-test/",
  postUploadPath: "./public/uploads/posts-test/",
  bundleUploadPath: "./public/uploads/bundles-test/",
  messageUploadPath: "./public/uploads/messages-test/",
  jwtSecret: "a-secret-string-for-test",
  generateVerifyCode() {
    // 生成6位数验证码的函数
    let code = "";
    const characters = "0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return code;
  },
  rateLimiter: {
    maxRequestsPerMinute: process.env.MAX_REQUESTS_PER_MINUTE || 10000000,
    timeWindowInMinutes: process.env.TIME_WINDOW_IN_MINUTES || 1,
  },
  ssl: {
    on: "off",
    privateKeyPath: "./certs/private.key",
    certificatePath: "./certs/certificate.crt",
  },
  jwtUploadSecret: "a-secret-string-for-test",
  uploadKey: "8fbe8212-8ba2-40c2-afef-4373ab4a88aa",
  jwtPublishBundleSecret: "a-secret-string-for-test",
  publishBundleKey: "8fbe8212-8ba2-40c2-afef-4373ab4a88aa",
  jwtRefreshBundleSecret: "a-secret-string-for-test",
  refreshBundleKey: "8fbe8212-8ba2-40c2-afef-4373ab4a88aa",
  jwtAdminSecret: "a-secret-string-for-test",
  saltRounds: 10,
  jwtMonitorSecret: "a-secret-string-for-test",
  monitorKey: "8fbe8212-8ba2-40c2-afef-4373ab4a88aa",
};
