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

const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatConversation",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sentTime: {
    type: Date,
    default: Date.now,
  },
  content: {
    type: String,
    required: true,
  },
  contentLength: {
    type: Number,
    required: false,
  },
  type: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5], // 消息类型 (0表示文本, 1表示语音，2表示图片，3表示视频，4表示音频，5表示礼物)
    default: 0,
  },
  readStatus: {
    type: Number,
    enum: [0, 1], // 消息的已读状态 (0: 未读, 1: 已读, 默认值: 0)
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

chatMessageSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
