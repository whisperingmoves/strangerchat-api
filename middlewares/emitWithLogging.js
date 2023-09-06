const emitWithLogging = (socket, event, data) => {
    socket.emit(event, data, () => {
        if (process.env.NODE_ENV === "test") {
            return;
        }

        console.log(`Event: ${event}, Args: ${JSON.stringify(data)}`);
    });
};

module.exports = emitWithLogging;