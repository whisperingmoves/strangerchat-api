// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const { calculateDistance } = require("../utils/distanceUtils");
const ChatConversation = require("../models/ChatConversation");
const User = require("../models/User");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { clientConversationId, opponentUserId } = data;

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
      clientConversationId,
      conversationId: conversation.id,
      opponentUserId: opponentUser.id,
      opponentAvatar: opponentUser.avatar,
      opponentUsername: opponentUser.username,
      opponentOnlineStatus: opponentUser.online,
      opponentDistance: undefined, // 距离为undefined，因为没有位置信息
      isFollowed: currentUser.following.includes(opponentUser.id) ? 1 : 0,
      isBlocked: currentUser.blockedUsers.includes(opponentUser.id) ? 1 : 0,
    };

    // 组装推送给对方用户的数据
    const opponentUserData = {
      conversationId: conversation.id,
      opponentUserId: userId,
      opponentAvatar: currentUser.avatar,
      opponentUsername: currentUser.username,
      opponentOnlineStatus: currentUser.online,
      opponentDistance: undefined, // 距离为undefined，因为没有位置信息
      isFollowed: opponentUser.following.includes(currentUser.id) ? 1 : 0,
      isBlocked: opponentUser.blockedUsers.includes(currentUser.id) ? 1 : 0,
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
        emitWithLogging(io.to(socketId), "notifications", {
          type: 3,
          data: currentUserData,
        });
      });
    }

    // 推送数据给对方用户
    const opponentUserSockets = userIdSocketMap[opponentUserId];
    if (opponentUserSockets) {
      opponentUserSockets.forEach((socketId) => {
        emitWithLogging(io.to(socketId), "notifications", {
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
