const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const systemNotificationController = require("../../controllers/admin/systemNotification");

const router = express.Router();

// 系统类通知路由
router.post(
  "/systemNotifications",
  adminAuth,
  systemNotificationController.createSystemNotification
);
router.delete(
  "/systemNotifications",
  adminAuth,
  systemNotificationController.deleteSystemNotifications
);

module.exports = router;
