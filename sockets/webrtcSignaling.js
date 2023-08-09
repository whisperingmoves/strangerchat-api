const ErrorMonitorService = require("../services/ErrorMonitorService");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId, type, data) => {
  try {
    const { opponentUserId } = data;

    // 修改 type 的值
    let modifiedType;
    switch (type) {
      case 7:
        modifiedType = 10;
        break;
      case 8:
        modifiedType = 11;
        break;
      case 9:
        modifiedType = 12;
        break;
      default:
        console.log("Invalid type");
        return;
    }

    // 修改 data 中的 opponentUserId 的值为 userId
    const modifiedData = { ...data, opponentUserId: userId };

    // 推送数据给对方用户
    const opponentUserSockets = userIdSocketMap[opponentUserId];
    if (opponentUserSockets) {
      opponentUserSockets.forEach((socketId) => {
        io.to(socketId).emit("notifications", {
          type: modifiedType,
          data: modifiedData,
        });
      });
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in webrtcSignaling socket controller:", error);
  }
};
