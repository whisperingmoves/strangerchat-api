const InteractionNotification = require("../models/InteractionNotification");
const StatusNotification = require("../models/StatusNotification");
const GiftNotification = require("../models/GiftNotification");
const SystemNotification = require("../models/SystemNotification");
const ErrorMonitorService = require("../services/ErrorMonitorService");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId) => {
  try {
    const interactionCount = await InteractionNotification.countDocuments({
      toUser: userId,
      readStatus: 0,
    });
    const statusCount = await StatusNotification.countDocuments({
      toUser: userId,
      readStatus: 0,
    });
    const giftCount = await GiftNotification.countDocuments({
      toUser: userId,
      readStatus: 0,
    });
    const systemCount = await SystemNotification.countDocuments({
      toUser: userId,
      readStatus: 0,
    });

    const totalUnreadCount =
      interactionCount + statusCount + giftCount + systemCount;

    const unreadNotificationsCount = {
      count: totalUnreadCount,
    };
    if (userIdSocketMap[userId]) {
      userIdSocketMap[userId].forEach((socketId) => {
        io.to(socketId).emit("notifications", {
          type: 2,
          data: unreadNotificationsCount,
        });
      });
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error(
      "Error in pushUnreadNotificationsCount socket controller:",
      error
    );
  }
};
