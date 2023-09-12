const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, coinBalance) => {
  try {
    if (userIdSocketMap[userId]) {
      userIdSocketMap[userId].forEach((socketId) => {
        emitWithLogging(io.to(socketId), "notifications", {
          type: 13,
          data: { coinBalance },
        });
      });
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in coinBalance socket controller:", error);
  }
};
