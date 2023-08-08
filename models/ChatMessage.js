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
  readStatus: {
    type: Number,
    enum: [0, 1], // 消息的已读状态 (0: 未读, 1: 已读, 默认值: 0)
    default: 0,
  },
});

chatMessageSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
