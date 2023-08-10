const express = require("express");
const verificationController = require("../controllers/verification");

const router = express.Router();

// 验证码路由
router.post(
  "/verifications/sendCode",
  verificationController.sendVerificationCode
);
router.post(
  "/verifications/verifyCode",
  verificationController.verifyVerificationCode
);

module.exports = router;
