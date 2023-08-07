const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');

module.exports = async (io, userIdSocketMap, userId, data) => {
    try {
        const { conversationId, opponentUserId, content } = data;

        // 查找指定的聊天会话
        const conversation = await ChatConversation.findById(conversationId);

        if (!conversation) {
            console.error('Conversation not found');
            return;
        }

        // 确保当前用户是会话的参与者
        if (
            conversation.userId1.toString() !== userId &&
            conversation.userId2.toString() !== userId
        ) {
            console.error('User is not a participant of the conversation');
            return;
        }

        // 创建聊天消息
        const message = new ChatMessage({
            conversationId: conversationId,
            senderId: userId,
            recipientId: opponentUserId,
            content: content,
        });

        await message.save();

        // 更新会话的lastMessageTime和lastMessageContent字段
        conversation.lastMessageTime = message.sentTime;
        conversation.lastMessageContent = content;
        await conversation.save();

        // 向发送者推送消息
        const senderNotification = {
            type: 7,
            data: {
                conversationId: conversationId,
                messageId: message.id,
                senderId: userId,
                recipientId: opponentUserId,
                content: content,
                sentTime: Math.floor(message.sentTime.getTime() / 1000),
                readStatus: message.readStatus,
            },
        };

        if (userIdSocketMap[userId]) {
            for (const socketId of userIdSocketMap[userId]) {
                io.to(socketId).emit('notifications', senderNotification);
            }
        }

        // 向接收者推送消息
        const recipientNotification = {
            type: 7,
            data: {
                conversationId: conversationId,
                messageId: message.id,
                senderId: userId,
                recipientId: opponentUserId,
                content: content,
                sentTime: Math.floor(message.sentTime.getTime() / 1000),
                readStatus: message.readStatus,
            },
        };

        if (userIdSocketMap[opponentUserId]) {
            for (const socketId of userIdSocketMap[opponentUserId].socketIds) {
                io.to(socketId).emit('notifications', recipientNotification);
            }
        }
    } catch (error) {
        console.error('Error in sendMessage socket controller:', error);
    }
};