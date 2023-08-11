const ChatConversation = require("../../models/ChatConversation");

const createChatConversation = async (req, res, next) => {
  try {
    const { userId1, userId2, lastMessageTime, lastMessageContent } = req.body;

    const chatConversation = await ChatConversation.create({
      userId1,
      userId2,
      lastMessageTime,
      lastMessageContent,
    });

    res.status(201).json({ id: chatConversation.id });
  } catch (error) {
    next(error);
  }
};

const deleteChatConversations = async (req, res, next) => {
  try {
    const { ids } = req.query;

    // 删除聊天会话
    await ChatConversation.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatConversation,
  deleteChatConversations,
};
