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
const pushNearestUsers = require("../sockets/pushNearestUsers");
const pushOnlineUsers = require("../sockets/pushOnlineUsers");

// 辅助函数：处理目标用户位置为空的情况
exports.processUsersWithEmptyLocation = async function (
  io,
  userIdSocketMap,
  currentUserId
) {
  const onlineUsers = Object.keys(userIdSocketMap);

  for (const userId of onlineUsers) {
    const socketIds = userIdSocketMap[userId];
    const user = await User.findById(userId);

    if (
      socketIds.length > 0 && // 用户在线
      user && // 用户存在
      (!user.location || !user.location.coordinates) && // 用户位置为空
      user.id !== currentUserId // 排除目标用户本身
    ) {
      // 执行特定的操作，例如向用户发送特定的消息
      await Promise.all([
        pushNearestUsers(io, userIdSocketMap, userId),
        pushOnlineUsers(io, userIdSocketMap, userId),
      ]);
    }
  }
};

// 辅助函数：处理所有在线用户
exports.processAllOnlineUsers = async function (
  io,
  userIdSocketMap,
  currentUserId
) {
  const onlineUsers = Object.keys(userIdSocketMap);

  for (const userId of onlineUsers) {
    const socketIds = userIdSocketMap[userId];
    const user = await User.findById(userId);

    if (
      socketIds.length > 0 && // 用户在线
      user && // 用户存在
      user.id !== currentUserId // 排除目标用户本身
    ) {
      // 执行特定的操作，例如向用户发送特定的消息
      await Promise.all([
        pushNearestUsers(io, userIdSocketMap, userId),
        pushOnlineUsers(io, userIdSocketMap, userId),
      ]);
    }
  }
};

// 辅助函数：处理目标用户位置不为空的情况
exports.processUsersWithLocation = async function (
  io,
  userIdSocketMap,
  currentUserId
) {
  const onlineUsers = Object.keys(userIdSocketMap);

  for (const userId of onlineUsers) {
    const socketIds = userIdSocketMap[userId];
    const user = await User.findById(userId);

    if (
      socketIds.length > 0 && // 用户在线
      user.location &&
      user.location.coordinates && // 用户位置不为空
      user.id !== currentUserId // 排除目标用户本身
    ) {
      // 执行特定的操作，例如向用户发送特定的消息
      await pushNearestUsers(io, userIdSocketMap, userId);
    }
  }
};

// 辅助函数：处理在线用户
exports.processOnlineUsers = async function (
  io,
  userIdSocketMap,
  currentUserId
) {
  const onlineUsers = Object.keys(userIdSocketMap);

  for (const userId of onlineUsers) {
    const socketIds = userIdSocketMap[userId];
    const user = await User.findById(userId);

    if (
      socketIds.length > 0 && // 用户在线
      user && // 用户在线
      user.id !== currentUserId // 排除目标用户本身
    ) {
      // 执行特定的操作，例如向用户发送特定的消息
      await pushOnlineUsers(io, userIdSocketMap, userId);
    }
  }
};
