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
const VoiceCallRecord = require("../models/VoiceCallRecord");
const ChatConversation = require("../models/ChatConversation");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { conversationId, opponentUserId, startTime, endTime } = data;

    // 创建语音通话记录
    const voiceCallRecord = new VoiceCallRecord({
      callerId: userId,
      recipientId: opponentUserId,
      startTime: new Date(startTime * 1000),
      endTime: new Date(endTime * 1000),
    });
    await voiceCallRecord.save();

    // 创建聊天消息
    const chatMessage = new ChatMessage({
      conversationId: conversationId,
      senderId: userId,
      recipientId: opponentUserId,
      sentTime: new Date(),
      content: "发起了语音通话",
    });
    await chatMessage.save();

    // 更新会话的lastMessageTime和lastMessageContent字段
    const conversation = await ChatConversation.findById(conversationId);
    conversation.lastMessageTime = chatMessage.sentTime;
    conversation.lastMessageContent = chatMessage.content;
    await conversation.save();

    // 向发送者推送聊天消息
    const senderNotification = {
      type: 9,
      data: {
        conversationId: conversationId,
        messageId: chatMessage.id,
        senderId: userId,
        recipientId: opponentUserId,
        voiceCallRecordId: voiceCallRecord.id,
        startTime: startTime,
        endTime: endTime,
        readStatus: chatMessage.readStatus,
      },
    };

    if (userIdSocketMap[userId]) {
      for (const socketId of userIdSocketMap[userId]) {
        emitWithLogging(io.to(socketId), "notifications", senderNotification);
      }
    }

    // 向接收者推送聊天消息
    const recipientNotification = {
      type: 9,
      data: {
        conversationId: conversationId,
        messageId: chatMessage.id,
        senderId: userId,
        recipientId: opponentUserId,
        voiceCallRecordId: voiceCallRecord.id,
        startTime: startTime,
        endTime: endTime,
        readStatus: chatMessage.readStatus,
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
    console.error("Error in initiateVoiceCall socket controller:", error);
  }
};
