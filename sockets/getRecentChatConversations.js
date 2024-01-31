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
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { timestamp } = data;

    // 准备查询条件
    const query = {
      $or: [{ userId1: userId }, { userId2: userId }],
    };

    if (timestamp) {
      query.lastMessageTime = { $gte: new Date(timestamp * 1000) };
    }

    // 创建游标并排序
    const cursor = ChatConversation.find(query)
      .sort({ lastMessageTime: -1 })
      .lean()
      .cursor();

    // let conversationCount = 0;
    let batch = [];

    const currentUser = await User.findById(userId);

    // 遍历游标获取会话
    for await (const conversation of cursor) {
      const opponentUserId =
        conversation.userId1.toString() === userId
          ? conversation.userId2.toString()
          : conversation.userId1.toString();

      const opponentUser = await User.findById(opponentUserId);

      let opponentDistance;
      if (opponentUser.location && opponentUser.location.coordinates) {
        if (currentUser.location && currentUser.location.coordinates) {
          opponentDistance = calculateDistance(
            currentUser.location.coordinates,
            opponentUser.location.coordinates
          );
        }
      }

      const unreadCount = await ChatMessage.countDocuments({
        conversationId: conversation._id,
        recipientId: userId,
        readStatus: 0,
      });

      const conversationData = {
        conversationId: conversation._id,
        opponentUserId,
        opponentAvatar: opponentUser.avatar,
        opponentUsername: opponentUser.username,
        opponentOnlineStatus: opponentUser.online || 0,
        opponentDistance: opponentDistance || undefined,
        lastMessageTime: conversation.lastMessageTime
          ? Math.floor(conversation.lastMessageTime.getTime() / 1000)
          : undefined,
        lastMessageContent: conversation.lastMessageContent,
        lastMessageType: conversation.lastMessageType,
        unreadCount,
        isFollowed: currentUser.following.includes(opponentUser.id) ? 1 : 0,
        isBlocked: currentUser.blockedUsers.includes(opponentUser.id) ? 1 : 0,
      };

      batch.push(conversationData);
      // conversationCount++;

      // 当达到每批次最大数量时，推送给用户
      if (batch.length === 10) {
        sendBatchedConversations(io, userIdSocketMap, userId, batch);
        batch = [];
      }
    }

    // 处理剩余的会话列表，如果有的话
    if (batch.length > 0) {
      sendBatchedConversations(io, userIdSocketMap, userId, batch);
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error(
      "Error in getRecentChatConversations socket controller:",
      error
    );
  }
};

// 分批推送会话列表
function sendBatchedConversations(io, userIdSocketMap, userId, batch) {
  const response = {
    type: 4,
    data: batch,
  };

  const socketIds = userIdSocketMap[userId];
  if (socketIds && socketIds.length > 0) {
    socketIds.forEach((socketId) => {
      emitWithLogging(io.to(socketId), "notifications", response);
    });
  }
}
