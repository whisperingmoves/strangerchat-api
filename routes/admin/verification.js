const express = require("express");
const verificationController = require("../../controllers/admin/verification");

const router = express.Router();

// 验证码路由
router.post("/verifications", verificationController.createVerification);
router.delete("/verifications", verificationController.deleteVerifications);
router.get("/verifications", verificationController.getVerificationList);
router.put(
  "/verifications/:verificationId",
  verificationController.updateVerification
);

module.exports = router;
