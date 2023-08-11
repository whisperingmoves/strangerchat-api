const express = require("express");
const verificationController = require("../../controllers/admin/verification");

const router = express.Router();

// 验证码路由
router.post("/verifications", verificationController.createVerification);

module.exports = router;