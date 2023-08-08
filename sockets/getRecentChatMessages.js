const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");

module.exports = async (io, userIdSocketMap, userId, data) => {
  try {
    const { conversationId, timestamp } = data;

    // 查找指定的聊天会话
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      console.error("Conversation not found");
      return;
    }

    // 确保当前用户是会话的参与者
    if (
      conversation.userId1.toString() !== userId &&
      conversation.userId2.toString() !== userId
    ) {
      console.error("User is not a participant of the conversation");
      return;
    }

    // 创建 MongoDB 查询构建器
    let query = ChatMessage.find({ conversationId }).sort({ sentTime: -1 });

    // 如果指定了时间戳，则查询大于等于时间戳的消息
    if (timestamp) {
      query = query.where("sentTime").gte(new Date(timestamp * 1000));
    }

    // 创建 MongoDB 游标
    const messagesCursor = query.lean().cursor();

    let batch = [];
    // let messageCount = 0;

    // 遍历游标获取消息并分批推送
    for await (const message of messagesCursor) {
      const {
        _id: messageId,
        senderId,
        recipientId,
        sentTime,
        content,
        readStatus,
      } = message;

      const recentMessage = {
        messageId,
        senderId: senderId,
        recipientId: recipientId,
        sentTime: Math.floor(sentTime.getTime() / 1000),
        content,
        readStatus,
      };

      batch.push(recentMessage);
      // messageCount++;

      // 当达到每批次最大数量时，推送给用户
      if (batch.length === 10) {
        // 向当前用户推送最近的聊天消息列表
        const notification = {
          type: 6,
          data: batch,
        };

        // 向用户推送通知
        if (userIdSocketMap[userId]) {
          for (const socketId of userIdSocketMap[userId].socketIds) {
            io.to(socketId).emit("notifications", notification);
          }
        }

        // 清空当前批次
        batch = [];
      }
    }

    // 处理剩余的消息，如果有的话
    if (batch.length > 0) {
      // 向当前用户推送最近的聊天消息列表
      const notification = {
        type: 6,
        data: batch,
      };

      // 向用户推送通知
      if (userIdSocketMap[userId]) {
        for (const socketId of userIdSocketMap[userId]) {
          io.to(socketId).emit("notifications", notification);
        }
      }
    }
  } catch (error) {
    console.error("Error in getRecentChatMessages socket controller:", error);
  }
};
