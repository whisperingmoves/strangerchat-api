const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, visitorsCount) => {
  try {
    if (userIdSocketMap[userId]) {
      userIdSocketMap[userId].forEach((socketId) => {
        emitWithLogging(io.to(socketId), "notifications", {
          type: 16,
          data: { visitorsCount },
        });
      });
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in visitorsCount socket controller:", error);
  }
};
