const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const chatMessageController = require("../../controllers/admin/chatMessage");

const router = express.Router();

// 聊天消息路由
router.post(
  "/chatMessages",
  adminAuth,
  chatMessageController.createChatMessage
);

module.exports = router;
