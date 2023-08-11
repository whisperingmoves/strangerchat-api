const express = require("express");
const chatConversationController = require("../../controllers/admin/chatConversation");

const router = express.Router();

// 聊天会话路由
router.post(
  "/chatConversations",
  chatConversationController.createChatConversation
);
router.delete(
  "/chatConversations",
  chatConversationController.deleteChatConversations
);

module.exports = router;
