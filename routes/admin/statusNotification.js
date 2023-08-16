const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const statusNotificationController = require("../../controllers/admin/statusNotification");

const router = express.Router();

// 状态类通知路由
router.post(
  "/statusNotifications",
  adminAuth,
  statusNotificationController.createStatusNotification
);
router.delete(
  "/statusNotifications",
  adminAuth,
  statusNotificationController.deleteStatusNotifications
);

module.exports = router;
