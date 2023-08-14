const mongoose = require("mongoose");

const interactionNotificationSchema = new mongoose.Schema({
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
  interactionType: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6], // 交互类型 (0: 给帖子点赞, 1: 评论帖子, 2: 分享帖子, 3: 收藏帖子, 4: 评论点赞, 5: 回复评论, 6: 帖子艾特用户)
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
  interactionTime: {
    type: Date,
    default: Date.now,
  },
  readStatus: {
    type: Number,
    enum: [0, 1], // 通知的已读状态 (0: 未读, 1: 已读, 默认值: 0)
    default: 0,
  },
});

// 定义虚拟字段 id
interactionNotificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model(
  "InteractionNotification",
  interactionNotificationSchema
);
