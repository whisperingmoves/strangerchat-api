const messageLogger = (socket, next) => {
  socket.onAny((event, ...args) => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    console.log(`Event: ${event}, Args: ${JSON.stringify(args)}`);
  });

  next();
};

module.exports = messageLogger;