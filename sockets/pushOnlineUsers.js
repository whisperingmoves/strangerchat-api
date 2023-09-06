const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId) => {
  try {
    let online = 0;
    for (const sockets of Object.values(userIdSocketMap)) {
      if (sockets.length > 0) {
        online += 1;
      }
    }
    if (userIdSocketMap[userId]) {
      userIdSocketMap[userId].forEach((socketId) => {
        emitWithLogging(io.to(socketId), "notifications", {
          type: 1,
          data: { online },
        });
      });
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in onlineUsers socket controller:", error);
  }
};
