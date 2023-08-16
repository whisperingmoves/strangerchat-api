const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const giftNotificationController = require("../../controllers/admin/giftNotification");

const router = express.Router();

// 礼物类通知路由
router.post(
  "/giftNotifications",
  adminAuth,
  giftNotificationController.createGiftNotification
);
router.delete(
  "/giftNotifications",
  adminAuth,
  giftNotificationController.deleteGiftNotifications
);

module.exports = router;
