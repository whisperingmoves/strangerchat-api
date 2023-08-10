const express = require("express");
const auth = require("../middlewares/auth");
const notificationController = require("../controllers/notification");

const router = express.Router();

// 通知路由
router.get(
  "/notifications/interaction",
  auth,
  notificationController.getInteractionNotifications
);
router.patch(
  "/notifications/interaction/:notificationId/read",
  auth,
  notificationController.markInteractionNotificationAsRead
);
router.get(
  "/notifications/status",
  auth,
  notificationController.getStatusNotifications
);
router.patch(
  "/notifications/status/:notificationId/read",
  auth,
  notificationController.markStatusNotificationAsRead
);
router.get(
  "/notifications/gift",
  auth,
  notificationController.getGiftNotifications
);
router.patch(
  "/notifications/gift/:notificationId/read",
  auth,
  notificationController.markGiftNotificationAsRead
);
router.get(
  "/notifications/system",
  auth,
  notificationController.getSystemNotifications
);
router.patch(
  "/notifications/system/:notificationId/read",
  auth,
  notificationController.markSystemNotificationAsRead
);

module.exports = router;
