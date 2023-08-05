const User = require('../models/User');
const pushNearestUsers = require('./pushNearestUsers');
const pushOnlineUsers = require('./pushOnlineUsers');
const pushUnreadNotificationsCount = require('./pushUnreadNotificationsCount');

module.exports = (io, socket, userIdSocketMap) => {
    console.log(`Socket connected: ${socket.id}`);

    // 将用户 id 和 socket id 的关联关系存储在内存中
    const { userId } = socket;
    if (!userIdSocketMap[userId]) {
        userIdSocketMap[userId] = [];
    }
    userIdSocketMap[userId].push(socket.id);

    // 将用户的在线状态设置为 1
    User.findByIdAndUpdate(userId, { online: 1 }, { new: false }).exec()
        .then(() => {
            console.log(`User ${userId} online`);
        })
        .catch(error => {
            console.error(error);
        });

    pushNearestUsers(io, userIdSocketMap, userId).then();
    pushOnlineUsers(io, userIdSocketMap, userId).then();
    pushUnreadNotificationsCount(io, userIdSocketMap, userId).then();

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        const socketIds = userIdSocketMap[userId];
        const socketIndex = socketIds.indexOf(socket.id);
        if (socketIndex > -1) {
            socketIds.splice(socketIndex, 1);
        }

        if (socketIds.length === 0) {
            // 将用户的在线状态设置为 0
            User.findByIdAndUpdate(userId, { online: 0 }, { new: false }).exec()
                .then(() => {
                    console.log(`User ${userId} offline`);
                })
                .catch(error => {
                    console.error(error);
                });
            delete userIdSocketMap[userId];
        }
    });
};
