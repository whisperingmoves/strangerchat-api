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

const deleteChatMessages = async (req, res, next) => {
  try {
    const { ids } = req.query;

    // 删除聊天消息
    await ChatMessage.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatMessage,
  deleteChatMessages,
};
