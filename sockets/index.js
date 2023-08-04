module.exports = (socket, userIdSocketMap) => {
    console.log(`Socket connected: ${socket.id}`);

    // 将用户id和socket.id的关联关系存储在内存中
    const { userId } = socket;
    userIdSocketMap[userId] = socket.id;

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        delete userIdSocketMap[userId];
    });
};