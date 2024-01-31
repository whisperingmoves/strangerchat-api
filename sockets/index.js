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

const User = require("../models/User");
const pushNearestUsers = require("./pushNearestUsers");
const pushOnlineUsers = require("./pushOnlineUsers");
const pushUnreadNotificationsCount = require("./pushUnreadNotificationsCount");
const pushCoinBalance = require("./pushCoinBalance");
const { processOnlineUsers } = require("../controllers/helper");
const createChatConversation = require("./createChatConversation");
const getRecentChatConversations = require("./getRecentChatConversations");
const getChatConversationDetails = require("./getChatConversationDetails");
const getRecentChatMessages = require("./getRecentChatMessages");
const sendMessage = require("./sendMessage");
const markMessageAsRead = require("./markMessageAsRead");
const initiateVoiceCall = require("./initiateVoiceCall");
const webrtcSignaling = require("./webrtcSignaling");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const pushGiftsReceived = require("./pushGiftsReceived");
const pushFollowersCount = require("./pushFollowersCount");
const pushVisitorsCount = require("./pushVisitorsCount");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = (io, socket, userIdSocketMap) => {
  console.log(`Socket connected: ${socket.id}`);

  // 将用户 id 和 socket id 的关联关系存储在内存中
  const { userId } = socket;
  if (!userIdSocketMap[userId]) {
    userIdSocketMap[userId] = [];
  }
  userIdSocketMap[userId].push(socket.id);

  // 将用户的在线状态设置为 1
  User.findByIdAndUpdate(userId, { online: 1 }, { new: false })
    .exec()
    .then((user) => {
      console.log(`User ${userId} online`);

      pushCoinBalance(io, userIdSocketMap, userId, user.coinBalance).then();

      pushGiftsReceived(io, userIdSocketMap, userId, user.giftsReceived).then();

      pushFollowersCount(
        io,
        userIdSocketMap,
        userId,
        user.followersCount
      ).then();

      pushVisitorsCount(io, userIdSocketMap, userId, user.visitorsCount).then();
    })
    .catch((error) => {
      errorMonitoringService.monitorError(error).then();
      console.error(error);
    });

  pushNearestUsers(io, userIdSocketMap, userId).then();
  pushOnlineUsers(io, userIdSocketMap, userId).then();
  pushUnreadNotificationsCount(io, userIdSocketMap, userId).then();
  processOnlineUsers(io, userIdSocketMap, userId)
    .then()
    .catch((error) => {
      errorMonitoringService.monitorError(error).then();
      console.error("processOnlineUsers error:", error);
    });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const socketIds = userIdSocketMap[userId];
    const socketIndex = socketIds.indexOf(socket.id);
    if (socketIndex > -1) {
      socketIds.splice(socketIndex, 1);
    }

    if (socketIds.length === 0) {
      // 将用户的在线状态设置为 0
      User.findByIdAndUpdate(userId, { online: 0 }, { new: false })
        .exec()
        .then(() => {
          console.log(`User ${userId} offline`);
        })
        .catch((error) => {
          console.error(error);
        });
      delete userIdSocketMap[userId];

      processOnlineUsers(io, userIdSocketMap, userId)
        .then()
        .catch((error) => {
          errorMonitoringService.monitorError(error).then();
          console.error("processOnlineUsers error:", error);
        });
    }
  });

  socket.on("messages", (data) => {
    const { type, data: messageData } = data;
    switch (type) {
      case 0:
        createChatConversation(io, userIdSocketMap, userId, messageData).then();
        break;
      case 1:
        getRecentChatConversations(
          io,
          userIdSocketMap,
          userId,
          messageData
        ).then();
        break;
      case 2:
        getChatConversationDetails(
          io,
          userIdSocketMap,
          userId,
          messageData
        ).then();
        break;
      case 3:
        getRecentChatMessages(io, userIdSocketMap, userId, messageData).then();
        break;
      case 4:
        sendMessage(io, userIdSocketMap, userId, messageData).then();
        break;
      case 5:
        markMessageAsRead(io, userIdSocketMap, userId, messageData).then();
        break;
      case 6:
        initiateVoiceCall(io, userIdSocketMap, userId, messageData).then();
        break;
      case 7:
      case 8:
      case 9:
        webrtcSignaling(io, userIdSocketMap, userId, type, messageData).then();
        break;
      default:
        console.log("Invalid message type");
    }
  });
};
