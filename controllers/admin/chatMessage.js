const ChatMessage = require("../../models/ChatMessage");

const createChatMessage = async (req, res, next) => {
  try {
    const {
      conversationId,
      senderId,
      recipientId,
      sentTime,
      content,
      readStatus,
    } = req.body;

    const chatMessage = await ChatMessage.create({
      conversationId,
      senderId,
      recipientId,
      sentTime,
      content,
      readStatus,
    });

    res.status(201).json({ id: chatMessage.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatMessage,
};
