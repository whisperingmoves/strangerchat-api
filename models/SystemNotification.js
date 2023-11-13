const mongoose = require("mongoose");

const systemNotificationSchema = new mongoose.Schema({
  toUser: {
    type: mongoose.Schema.Types.ObjectId, // 该通知下发给哪个用户
    ref: "User",
    required: true,
  },
  notificationType: {
    type: Number,
    required: true,
    enum: [0, 1], // 通知类型 (0: 更新提醒, 1: 金币购买成功)
  },
  notificationTitle: {
    type: String,
    required: true,
  },
  notificationContent: {
    type: String,
    required: true,
  },
  notificationTime: {
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
systemNotificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("SystemNotification", systemNotificationSchema);
