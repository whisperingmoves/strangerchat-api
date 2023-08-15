const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const verificationController = require("../../controllers/admin/verification");

const router = express.Router();

// 验证码路由
router.post(
  "/verifications",
  adminAuth,
  verificationController.createVerification
);
router.delete(
  "/verifications",
  adminAuth,
  verificationController.deleteVerifications
);
router.get(
  "/verifications",
  adminAuth,
  verificationController.getVerificationList
);
router.put(
  "/verifications/:verificationId",
  adminAuth,
  verificationController.updateVerification
);

module.exports = router;
