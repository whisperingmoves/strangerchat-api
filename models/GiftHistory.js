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

const giftHistorySchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gift",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
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

giftHistorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

giftHistorySchema.statics.getReceivedGiftCount = async function (
  userId,
  startDate,
  endDate
) {
  return await this.aggregate([
    {
      $match: {
        receiver: mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$sender",
        count: { $sum: "$quantity" },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 7,
    },
  ]);
};

module.exports = mongoose.model("GiftHistory", giftHistorySchema);
