const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { conversationId, clientMessageId, opponentUserId, content, type } =
      data;

    // 查找指定的聊天会话
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      const error = new Error("Conversation not found");
      errorMonitoringService.monitorError(error).then();
      console.error(error.message);
      return;
    }

    // 确保当前用户是会话的参与者
    if (
      conversation.userId1.toString() !== userId &&
      conversation.userId2.toString() !== userId
    ) {
      const error = new Error("User is not a participant of the conversation");
      errorMonitoringService.monitorError(error).then();
      console.error(error.message);
      return;
    }

    // 创建聊天消息
    const message = new ChatMessage({
      conversationId: conversationId,
      senderId: userId,
      recipientId: opponentUserId,
      content: content,
      type,
    });

    await message.save();

    // 更新会话的lastMessageTime和lastMessageContent字段
    conversation.lastMessageTime = message.sentTime;
    conversation.lastMessageContent = content;
    conversation.lastMessageType = type;
    await conversation.save();

    // 向发送者推送消息
    const senderNotification = {
      type: 7,
      data: {
        conversationId: conversationId,
        clientMessageId,
        messageId: message.id,
        senderId: userId,
        recipientId: opponentUserId,
        content: content,
        sentTime: Math.floor(message.sentTime.getTime() / 1000),
        type,
        readStatus: message.readStatus,
      },
    };

    if (userIdSocketMap[userId]) {
      for (const socketId of userIdSocketMap[userId]) {
        emitWithLogging(io.to(socketId), "notifications", senderNotification);
      }
    }

    // 向接收者推送消息
    const recipientNotification = {
      type: 7,
      data: {
        conversationId: conversationId,
        messageId: message.id,
        senderId: userId,
        recipientId: opponentUserId,
        content: content,
        sentTime: Math.floor(message.sentTime.getTime() / 1000),
        type,
        readStatus: message.readStatus,
      },
    };

    if (userIdSocketMap[opponentUserId]) {
      for (const socketId of userIdSocketMap[opponentUserId]) {
        emitWithLogging(
          io.to(socketId),
          "notifications",
          recipientNotification
        );
      }
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in sendMessage socket controller:", error);
  }
};
