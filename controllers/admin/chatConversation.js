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

module.exports = {
  createChatConversation,
};
