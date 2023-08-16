const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const interactionNotificationController = require("../../controllers/admin/interactionNotification");

const router = express.Router();

// 交互类通知路由
router.post(
  "/interactionNotifications",
  adminAuth,
  interactionNotificationController.createInteractionNotification
);
router.delete(
  "/interactionNotifications",
  adminAuth,
  interactionNotificationController.deleteInteractionNotifications
);
router.get(
  "/interactionNotifications",
  adminAuth,
  interactionNotificationController.getInteractionNotificationList
);
router.put(
  "/interactionNotifications/:interactionNotificationId",
  adminAuth,
  interactionNotificationController.updateInteractionNotification
);

module.exports = router;
