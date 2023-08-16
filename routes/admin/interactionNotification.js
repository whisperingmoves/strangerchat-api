const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const interactionNotificationController = require("../../controllers/admin/interactionNotification");

const router = express.Router();

// 通知
router.post(
  "/interactionNotifications",
  adminAuth,
  interactionNotificationController.createInteractionNotification
);

module.exports = router;
