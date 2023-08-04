const User = require('../models/User');

module.exports = (socket, userIdSocketMap) => {
    console.log(`Socket connected: ${socket.id}`);

    // 将用户 id 和 socket id 的关联关系存储在内存中
    const { userId } = socket;
    userIdSocketMap[userId] = socket.id;

    // 将用户的在线状态设置为 1
    User.findByIdAndUpdate(userId, { online: 1 }, { new: false }).exec()
        .then(() => {
            console.log(`User ${userId} online`);
        })
        .catch(error => {
            console.error(error);
        });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        delete userIdSocketMap[userId];

        // 将用户的在线状态设置为 0
        User.findByIdAndUpdate(userId, { online: 0 }, { new: false }).exec()
            .then(() => {
                console.log(`User ${userId} offline`);
            })
            .catch(error => {
                console.error(error);
            });
    });
};