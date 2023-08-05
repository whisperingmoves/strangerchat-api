const User = require('../models/User');
const pushNearestUsers = require('../sockets/pushNearestUsers');
const pushOnlineUsers = require('../sockets/pushOnlineUsers');

// 辅助函数：处理目标用户位置为空的情况
exports.processUsersWithEmptyLocation = async function (io, userIdSocketMap, currentUserId) {
    const onlineUsers = Object.keys(userIdSocketMap);

    for (const userId of onlineUsers) {
        const socketIds = userIdSocketMap[userId];
        const user = await User.findById(userId);

        if (
            socketIds.length > 0 && // 用户在线
            (!user.location || !user.location.coordinates) && // 用户位置为空
            user.id !== currentUserId // 排除目标用户本身
        ) {
            // 执行特定的操作，例如向用户发送特定的消息
            await Promise.all([
                pushNearestUsers(io, userIdSocketMap, userId),
                pushOnlineUsers(io, userIdSocketMap, userId)
            ]);
        }
    }
}

// 辅助函数：处理所有在线用户
exports.processAllOnlineUsers = async function (io, userIdSocketMap, currentUserId) {
    const onlineUsers = Object.keys(userIdSocketMap);

    for (const userId of onlineUsers) {
        const socketIds = userIdSocketMap[userId];
        const user = await User.findById(userId);

        if (
            socketIds.length > 0 && // 用户在线
            user.id !== currentUserId // 排除目标用户本身
        ) {
            // 执行特定的操作，例如向用户发送特定的消息
            await Promise.all([
                pushNearestUsers(io, userIdSocketMap, userId),
                pushOnlineUsers(io, userIdSocketMap, userId)
            ]);
        }
    }
}

// 辅助函数：处理目标用户位置不为空的情况
exports.processUsersWithLocation = async function (io, userIdSocketMap, currentUserId) {
    const onlineUsers = Object.keys(userIdSocketMap);

    for (const userId of onlineUsers) {
        const socketIds = userIdSocketMap[userId];
        const user = await User.findById(userId);

        if (
            socketIds.length > 0 && // 用户在线
            (user.location && user.location.coordinates) && // 用户位置不为空
            user.id !== currentUserId // 排除目标用户本身
        ) {
            // 执行特定的操作，例如向用户发送特定的消息
            await pushNearestUsers(io, userIdSocketMap, userId);
        }
    }
}

// 辅助函数：处理在线用户
exports.processOnlineUsers = async function (io, userIdSocketMap, currentUserId) {
    const onlineUsers = Object.keys(userIdSocketMap);

    for (const userId of onlineUsers) {
        const socketIds = userIdSocketMap[userId];
        const user = await User.findById(userId);

        if (
            socketIds.length > 0 && // 用户在线
            user.id !== currentUserId // 排除目标用户本身
        ) {
            // 执行特定的操作，例如向用户发送特定的消息
            await pushOnlineUsers(io, userIdSocketMap, userId);
        }
    }
}
