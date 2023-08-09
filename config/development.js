module.exports = {
  env: "development",
  port: 3000,
  dbUrl: "mongodb://localhost:27018/chat_dev",
  monitorDbUrl: "mongodb://localhost:27018/monitor_dev",
  verifyCodeExpires: 60,
  avatarUploadPath: "./public/uploads/avatars-dev/",
  postUploadPath: "./public/uploads/posts-dev/",
  bundleUploadPath: "./public/uploads/bundles-dev/",
  jwtSecret: "a-secret-string-for-dev",
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
    maxRequestsPerMinute: 100,
    timeWindowInMinutes: 1,
  },
  ssl: {
    on: "off",
    privateKeyPath: "./certs/private.key",
    certificatePath: "./certs/certificate.crt",
  },
  jwtUploadSecret: "a-secret-string-for-dev",
  uploadKey: "7b6aa7fc-33e8-413d-9bf5-65e18becc65e",
  jwtPublishBundleSecret: "a-secret-string-for-dev",
  publishBundleKey: "7b6aa7fc-33e8-413d-9bf5-65e18becc65e",
  jwtRefreshBundleSecret: "a-secret-string-for-dev",
  refreshBundleKey: "7b6aa7fc-33e8-413d-9bf5-65e18becc65e",
  jwtAdminSecret: "a-secret-string-for-dev",
  saltRounds: 10,
  jwtMonitorSecret: "a-secret-string-for-dev",
  monitorKey: "7b6aa7fc-33e8-413d-9bf5-65e18becc65e",
};
