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
router.delete(
  "/chatMessages",
  adminAuth,
  chatMessageController.deleteChatMessages
);
router.get(
  "/chatMessages",
  adminAuth,
  chatMessageController.getChatMessageList
);
router.put(
  "/chatMessages/:chatMessageId",
  adminAuth,
  chatMessageController.updateChatMessage
);

module.exports = router;
