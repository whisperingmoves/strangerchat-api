const mongoose = require("mongoose");
const GiftHistory = require("./GiftHistory");

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  gender: String,
  birthday: Date,
  avatar: String,
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
