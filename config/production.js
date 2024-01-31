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
  env: process.env.NODE_ENV || "production",
  port: process.env.PORT || 3000,
  dbUrl: process.env.MONGO_URL || "mongodb://localhost/chat",
  monitorDbUrl: process.env.MONGO_MONITOR_URL || "mongodb://localhost/monitor",
  verifyCodeExpires: process.env.CODE_EXPIRES || 300, // 验证码有效时间(秒)
  avatarUploadPath:
    process.env.AVATAR_UPLOAD_PATH || "./public/uploads/avatars/",
  postUploadPath: process.env.POST_UPLOAD_PATH || "./public/uploads/posts/",
  bundleUploadPath:
    process.env.BUNDLE_UPLOAD_PATH || "./public/uploads/bundles/",
  messageUploadPath:
    process.env.MESSAGE_UPLOAD_PATH || "./public/uploads/messages/",
  jwtSecret: process.env.JWT_SECRET || "a long random string",
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
    maxRequestsPerMinute: process.env.MAX_REQUESTS_PER_MINUTE || 100,
    timeWindowInMinutes: process.env.TIME_WINDOW_IN_MINUTES || 1,
  },
  ssl: {
    on: process.env.SSL_ON || "on",
    privateKeyPath: process.env.PRIVATE_KEY_PATH || "./certs/private.key",
    certificatePath: process.env.CERTIFICATE_PATH || "./certs/certificate.crt",
  },
  jwtUploadSecret: process.env.JWT_UPLOAD_SECRET || "a long random string",
  uploadKey: process.env.UPLOAD_KEY || "fd3fe3f6-2a93-47fa-b45d-917db5825314",
  jwtPublishBundleSecret:
    process.env.JWT_PUBLISH_BUNDLE_SECRET || "a long random string",
  publishBundleKey:
    process.env.PUBLISH_BUNDLE_KEY || "fd3fe3f6-2a93-47fa-b45d-917db5825314",
  jwtRefreshBundleSecret:
    process.env.JWT_REFRESH_BUNDLE_SECRET || "a long random string",
  refreshBundleKey:
    process.env.REFRESH_BUNDLE_KEY || "fd3fe3f6-2a93-47fa-b45d-917db5825314",
  jwtAdminSecret: process.env.JWT_ADMIN_SECRET || "a long random string",
  saltRounds: process.env.SALT_ROUNDS || 14,
  jwtMonitorSecret: process.env.JWT_MONITOR_SECRET || "a long random string",
  monitorKey: process.env.MONITOR_KEY || "fd3fe3f6-2a93-47fa-b45d-917db5825314",
};
