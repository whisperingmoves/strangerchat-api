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

    const currentUser = await User.findById(userId);

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
      lastMessageContent: conversation.lastMessageContent,
      lastMessageType: conversation.lastMessageType,
      unreadCount,
      isFollowed: currentUser.following.includes(opponentUser.id) ? 1 : 0,
      isBlocked: currentUser.blockedUsers.includes(opponentUser.id) ? 1 : 0,
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
