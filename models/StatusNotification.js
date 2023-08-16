const mongoose = require("mongoose");

const statusNotificationSchema = new mongoose.Schema({
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
  statusType: {
    type: Number,
    required: true,
    enum: [0, 1], // 状态类型 (0: 关注, 1: 访问主页)
  },
  statusTime: {
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
statusNotificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("StatusNotification", statusNotificationSchema);
