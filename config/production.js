module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  dbUrl: process.env.MONGO_URL || "mongodb://localhost/chat",
  verifyCodeExpires: process.env.CODE_EXPIRES || 300, // 验证码有效时间(秒)
  avatarUploadPath:
    process.env.AVATAR_UPLOAD_PATH || "./public/uploads/avatars/",
  postUploadPath: process.env.POST_UPLOAD_PATH || "./public/uploads/posts/",
  bundleUploadPath:
    process.env.BUNDLE_UPLOAD_PATH || "./public/uploads/bundles/",
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
};
