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

const giftNotificationSchema = new mongoose.Schema({
  toUser: {
    type: mongoose.Schema.Types.ObjectId, // 该通知下发给哪个用户
    ref: "User",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, // 触发该通知的其他用户
    ref: "User",
    required: true,
  },
  giftQuantity: {
    type: Number,
    required: true,
  },
  giftName: {
    type: String,
    required: true,
  },
  giftTime: {
    type: Date,
    default: Date.now,
  },
  readStatus: {
    type: Number,
    enum: [0, 1], // 通知的已读状态 (0: 未读, 1: 已读, 默认值: 0)
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

// 定义虚拟字段 id
giftNotificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("GiftNotification", giftNotificationSchema);
