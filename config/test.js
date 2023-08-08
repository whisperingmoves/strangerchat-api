module.exports = {
  env: "test",
  port: 3001,
  dbUrl: "mongodb://localhost:27018/chat_test",
  verifyCodeExpires: 60,
  avatarUploadPath: "./public/uploads/avatars-test/",
  postUploadPath: "./public/uploads/posts-test/",
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
};
