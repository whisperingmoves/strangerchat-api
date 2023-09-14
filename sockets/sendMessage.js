const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const GiftService = require("../services/GiftService");
const emitWithLogging = require("../middlewares/emitWithLogging");
const User = require("../models/User");
const Gift = require("../models/Gift");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const {
      conversationId,
      clientMessageId,
      opponentUserId,
      content,
      contentLength,
      type,
      giftId,
    } = data;

    const isBlocked = await User.findOne({
      _id: opponentUserId,
      blockedUsers: userId,
    })
      .countDocuments()
      .exec();

    if (isBlocked) {
      console.error("用户被拉黑");

      return;
    }

    if (type === 5 && giftId) {
      // 接收礼物的用户
      const receiver = await User.findById(opponentUserId);

      // 礼物
      const gift = await Gift.findById(giftId);

      // 检查当前用户的金币余额是否足够购买礼物
      const sender = await User.findById(userId);
      if (sender.coinBalance < gift.value) {
        console.error("金币余额不足");

        return;
      }

      await GiftService.sendGift(
        sender,
        receiver,
        gift,
        1,
        io,
        userIdSocketMap
      );
    }

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
      contentLength,
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
        contentLength,
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
        contentLength,
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
