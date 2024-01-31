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

const chatConversationSchema = new mongoose.Schema({
  userId1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userId2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lastMessageTime: {
    type: Date,
  },
  lastMessageContent: {
    type: String,
  },
  lastMessageType: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5], // 最后一条消息类型 (0表示文本, 1表示语音，2表示图片，3表示视频，4表示音频，5表示礼物)
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

chatConversationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
