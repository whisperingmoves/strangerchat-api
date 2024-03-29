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
const GiftHistory = require("./GiftHistory");

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  gender: { type: String, required: true },
  birthday: { type: Date, required: true },
  avatar: { type: String, required: true },
  giftsReceived: { type: Number, default: 0 },
  username: { type: String },
  city: String,
  followingCount: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  visitorsCount: { type: Number, default: 0 },
  freeHeatsLeft: { type: Number, default: 3 },
  coinBalance: { type: Number, default: 0 },
  checkedDays: { type: Number, default: 0 }, // 连续签到的天数
  lastCheckDate: { type: Date }, // 上次签到的日期
  location: {
    type: {
      type: String,
      default: "Point", // 'Point' indicating geographic coordinates
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
  },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // 拉黑的用户列表
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  receivedGiftRankings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastRanking: Number,
    },
  ],
  online: {
    type: Number,
    enum: [0, 1], // 是否在线 (0: 否, 1: 是, 默认值: 0)
    default: 0,
  },
  language: { type: String },
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.methods.followUser = async function (userId) {
  if (this.following.indexOf(userId) === -1) {
    this.following.push(userId);
    this.followingCount++;
    await this.save();
  }
};

userSchema.methods.unfollowUser = async function (userId) {
  const index = this.following.indexOf(userId);
  if (index !== -1) {
    this.following.splice(index, 1);
    this.followingCount--;
    await this.save();
  }
};

userSchema.methods.blockUser = async function (userId) {
  if (this.blockedUsers.indexOf(userId) === -1) {
    this.blockedUsers.push(userId);
    await this.save();
  }
};

userSchema.methods.unblockUser = async function (userId) {
  const index = this.blockedUsers.indexOf(userId);
  if (index !== -1) {
    this.blockedUsers.splice(index, 1);
    await this.save();
  }
};

userSchema.methods.getReceivedGiftStats = async function (startDate, endDate) {
  const userId = this._id;
  const currentRankings = this.receivedGiftRankings || [];

  // 获取当前用户在指定时间范围内收到礼物的数量和排名信息
  const result = await GiftHistory.getReceivedGiftCount(
    userId,
    startDate,
    endDate
  );
  const userIds = result.map((item) => item._id);
  const userInfo = await this.constructor.getUserInfo(userIds);
  const stats = result.map((item, index) => {
    const currentRanking =
      currentRankings.find(
        (ranking) => String(ranking.userId) === String(item._id)
      ) || {};
    const lastRanking = currentRanking.lastRanking || index + 1;
    const diff = lastRanking - (index + 1);
    return {
      userId: item._id,
      count: item.count,
      currentRanking: index + 1,
      diff,
      username: userInfo[item._id].username,
      avatar: userInfo[item._id].avatar,
    };
  });

  // 更新当前用户在指定时间范围内的排名信息
  this.receivedGiftRankings = stats.map((item) => ({
    userId: item.userId,
    lastRanking: item.currentRanking,
  }));
  await this.save();

  return stats;
};

userSchema.statics.getUserInfo = async function (userIds) {
  const users = await this.find(
    { _id: { $in: userIds } },
    { _id: 1, username: 1, avatar: 1 }
  );
  return users.reduce((acc, user) => {
    acc[user._id] = {
      username: user.username,
      avatar: user.avatar,
    };
    return acc;
  }, {});
};

module.exports = mongoose.model("User", userSchema);
