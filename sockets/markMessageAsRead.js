const ChatMessage = require("../models/ChatMessage");

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { conversationId, messageId } = data;

    // 查找指定的聊天消息
    const message = await ChatMessage.findOne({
      _id: messageId,
      conversationId: conversationId,
      recipientId: userId,
    });

    if (!message) {
      console.error("Message not found");
      return;
    }

    // 将消息标记为已读
    message.readStatus = 1;
    await message.save();

    // 向发送者推送已读状态
    const senderNotification = {
      type: 8,
      data: {
        conversationId: conversationId,
        messageId: messageId,
        readStatus: message.readStatus,
      },
    };

    if (userIdSocketMap[userId]) {
      for (const socketId of userIdSocketMap[userId]) {
        io.to(socketId).emit("notifications", senderNotification);
      }
    }

    // 向接收者推送已读状态
    const recipientNotification = {
      type: 8,
      data: {
        conversationId: conversationId,
        messageId: messageId,
        readStatus: message.readStatus,
      },
    };

    if (userIdSocketMap[message.senderId.toString()]) {
      for (const socketId of userIdSocketMap[message.senderId.toString()]) {
        io.to(socketId).emit("notifications", recipientNotification);
      }
    }
  } catch (error) {
    console.error("Error in markMessageAsRead socket controller:", error);
  }
};
