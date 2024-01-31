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

const ChatMessage = require("../models/ChatMessage");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

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
      const error = new Error("Message not found");
      errorMonitoringService.monitorError(error).then();
      console.error(error.message);
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
        emitWithLogging(io.to(socketId), "notifications", senderNotification);
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
        emitWithLogging(
          io.to(socketId),
          "notifications",
          recipientNotification
        );
      }
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in markMessageAsRead socket controller:", error);
  }
};
