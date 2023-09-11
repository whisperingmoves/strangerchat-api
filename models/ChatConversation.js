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
