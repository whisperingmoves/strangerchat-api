const User = require('../models/User');
const pushNearestUsers = require('./pushNearestUsers');
const pushOnlineUsers = require('./pushOnlineUsers');
const pushUnreadNotificationsCount = require('./pushUnreadNotificationsCount');
const { processOnlineUsers } = require("../controllers/helper");
const createChatConversation = require('./createChatConversation');
const getRecentChatConversations = require('./getRecentChatConversations');
const getChatConversationDetails = require('./getChatConversationDetails');
const getRecentChatMessages = require('./getRecentChatMessages');
const sendMessage = require('./sendMessage');
const markMessageAsRead = require('./markMessageAsRead');
const initiateVoiceCall = require('./initiateVoiceCall');

module.exports = (io, socket, userIdSocketMap) => {
    console.log(`Socket connected: ${socket.id}`);

    // 将用户 id 和 socket id 的关联关系存储在内存中
    const { userId } = socket;
    if (!userIdSocketMap[userId]) {
        userIdSocketMap[userId] = [];
    }
    userIdSocketMap[userId].push(socket.id);

    // 将用户的在线状态设置为 1
    User.findByIdAndUpdate(userId, { online: 1 }, { new: false })
        .exec()
        .then(() => {
            console.log(`User ${userId} online`);
        })
        .catch(error => {
            console.error(error);
        });

    pushNearestUsers(io, userIdSocketMap, userId)
        .then()
        .catch(err => console.error("pushNearestUsers error:", err));
    pushOnlineUsers(io, userIdSocketMap, userId)
        .then()
        .catch(err => console.error("pushOnlineUsers error:", err));
    pushUnreadNotificationsCount(io, userIdSocketMap, userId)
        .then()
        .catch(err => console.error("pushUnreadNotificationsCount error:", err));
    processOnlineUsers(io, userIdSocketMap, userId)
        .then()
        .catch(err => console.error("processOnlineUsers error:", err));

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        const socketIds = userIdSocketMap[userId];
        const socketIndex = socketIds.indexOf(socket.id);
        if (socketIndex > -1) {
            socketIds.splice(socketIndex, 1);
        }

        if (socketIds.length === 0) {
            // 将用户的在线状态设置为 0
            User.findByIdAndUpdate(userId, { online: 0 }, { new: false })
                .exec()
                .then(() => {
                    console.log(`User ${userId} offline`);
                })
                .catch(error => {
                    console.error(error);
                });
            delete userIdSocketMap[userId];

            processOnlineUsers(io, userIdSocketMap, userId)
                .then()
                .catch(err => console.error("processOnlineUsers error:", err));
        }
    });

    socket.on('messages', (data) => {
        const { type, data: messageData } = data;
        switch (type) {
            case 0:
                createChatConversation(io, userIdSocketMap, userId, messageData)
                    .then()
                    .catch(err => console.error("createChatConversation error:", err));
                break;
            case 1:
                getRecentChatConversations(io, userIdSocketMap, userId, messageData)
                    .then()
                    .catch(err => console.error("getRecentChatConversations error:", err));
                break;
            case 2:
                getChatConversationDetails(io, userIdSocketMap, userId, messageData)
                    .then()
                    .catch(err => console.error("getChatConversationDetails error:", err));
                break;
            case 3:
                getRecentChatMessages(io, userIdSocketMap, userId, messageData)
                    .then()
                    .catch(err => console.error("getRecentChatMessages error:", err));
                break;
            case 4:
                sendMessage(io, userIdSocketMap, userId, messageData)
                    .then()
                    .catch(err => console.error("sendMessage error:", err));
                break;
            case 5:
                markMessageAsRead(io, userIdSocketMap, userId, messageData)
                    .then()
                    .catch(err => console.error("markMessageAsRead error:", err));
                break;
            case 6:
                initiateVoiceCall(io, userIdSocketMap, userId, messageData)
                    .then()
                    .catch(err => console.error("initiateVoiceCall error:", err));
                break;
            default:
                console.log('Invalid message type');
        }
    });
};
