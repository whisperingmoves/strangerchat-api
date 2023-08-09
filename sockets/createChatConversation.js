const { calculateDistance } = require("../utils/distanceUtils");
const ChatConversation = require("../models/ChatConversation");
const User = require("../models/User");
const ErrorMonitorService = require("../services/ErrorMonitorService");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { opponentUserId } = data;

    // 创建聊天会话
    const conversation = await ChatConversation.create({
      userId1: userId,
      userId2: opponentUserId,
    });

    // 获取当前用户和对方用户的信息
    const [currentUser, opponentUser] = await Promise.all([
      User.findById(userId),
      User.findById(opponentUserId),
    ]);

    // 组装推送给当前用户的数据
    const currentUserData = {
      conversationId: conversation.id,
      opponentUserId: opponentUser.id,
      opponentAvatar: opponentUser.avatar,
      opponentUsername: opponentUser.username,
      opponentOnlineStatus: opponentUser.online,
      opponentDistance: undefined, // 距离为undefined，因为没有位置信息
    };

    // 组装推送给对方用户的数据
    const opponentUserData = {
      conversationId: conversation.id,
      opponentUserId: userId,
      opponentAvatar: currentUser.avatar,
      opponentUsername: currentUser.username,
      opponentOnlineStatus: currentUser.online,
      opponentDistance: undefined, // 距离为undefined，因为没有位置信息
    };

    // 如果参与会话的双方的用户模型的location字段不为空并且location.coordinates不为空，则计算距离
    if (
      currentUser.location &&
      currentUser.location.coordinates &&
      opponentUser.location &&
      opponentUser.location.coordinates
    ) {
      const currentUserCoords = currentUser.location.coordinates;
      const opponentUserCoords = opponentUser.location.coordinates;
      const distance = calculateDistance(currentUserCoords, opponentUserCoords);
      currentUserData.opponentDistance = distance;
      opponentUserData.opponentDistance = distance;
    }

    // 推送数据给当前用户
    const currentUserSockets = userIdSocketMap[userId];
    if (currentUserSockets) {
      currentUserSockets.forEach((socketId) => {
        io.to(socketId).emit("notifications", {
          type: 3,
          data: currentUserData,
        });
      });
    }

    // 推送数据给对方用户
    const opponentUserSockets = userIdSocketMap[opponentUserId];
    if (opponentUserSockets) {
      opponentUserSockets.forEach((socketId) => {
        io.to(socketId).emit("notifications", {
          type: 3,
          data: opponentUserData,
        });
      });
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in createChatConversation socket controller:", error);
  }
};
