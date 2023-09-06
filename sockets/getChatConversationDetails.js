const { calculateDistance } = require("../utils/distanceUtils");
const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { conversationId } = data;

    // 查找聊天会话详情
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      // 聊天会话不存在
      const error = new Error("Conversation not found");
      errorMonitoringService.monitorError(error).then();
      console.error(error.message);
      return;
    }

    // 查找对方用户信息
    const opponentUserId =
      conversation.userId1.toString() === userId
        ? conversation.userId2
        : conversation.userId1;
    const opponentUser = await User.findById(opponentUserId);

    // 计算对方用户的在线状态
    const opponentOnlineStatus = opponentUser.online;

    // 计算对方用户距离当前用户的距离
    let opponentDistance;
    if (opponentUser.location && opponentUser.location.coordinates) {
      const currentUser = await User.findById(userId);
      if (currentUser.location && currentUser.location.coordinates) {
        opponentDistance = calculateDistance(
          currentUser.location.coordinates,
          opponentUser.location.coordinates
        );
      }
    }

    // 统计未读消息数量
    const unreadCount = await ChatMessage.countDocuments({
      conversationId,
      recipientId: userId,
      readStatus: 0,
    });

    // 获取对方用户的用户名和头像
    const opponentUsername = opponentUser.username;
    const opponentAvatar = opponentUser.avatar;

    // 截取最后一条消息的内容，限制长度为100
    const lastMessageContent = conversation.lastMessageContent || "";
    const truncatedContent =
      lastMessageContent.length > 100
        ? lastMessageContent.substring(0, 100) + "..."
        : lastMessageContent;

    // 构造聊天会话详情数据
    const chatConversationDetails = {
      conversationId,
      opponentUserId,
      opponentAvatar,
      opponentUsername,
      opponentOnlineStatus,
      opponentDistance,
      lastMessageTime: conversation.lastMessageTime
        ? Math.floor(conversation.lastMessageTime.getTime() / 1000)
        : undefined,
      lastMessageContent: truncatedContent || undefined,
      unreadCount,
    };

    // 向用户推送聊天会话详情数据
    const jsonData = {
      type: 5,
      data: chatConversationDetails,
    };

    const socketIds = userIdSocketMap[userId];
    if (socketIds && socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        emitWithLogging(io.to(socketId), "notifications", jsonData);
      });
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error(
      "Error in getChatConversationDetails socket controller:",
      error
    );
  }
};
