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
router.get(
    "/chatConversations",
    chatConversationController.getChatConversationList
);
router.put(
    "/chatConversations/:conversationId",
    chatConversationController.updateChatConversation
);

module.exports = router;
