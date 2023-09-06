const User = require("../models/User");
const mongoose = require("mongoose");
const { calculateDistance } = require("../utils/distanceUtils");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = async (io, userIdSocketMap, userId) => {
  try {
    const currentUser = await User.findById(userId);
    if (
      !currentUser.location ||
      !currentUser.location.coordinates ||
      !currentUser.location.coordinates.length
    ) {
      // 如果当前用户没有位置信息，就推送最新的5位用户
      const latestUsers = await User.find({ _id: { $ne: userId } })
        .sort({ createdAt: -1 })
        .limit(5);
      const users = latestUsers.map((user) => ({
        userId: user.id,
        avatarUrl: user.avatar,
        username: user.username,
        distance: undefined,
      }));
      if (userIdSocketMap[userId]) {
        userIdSocketMap[userId].forEach((socketId) => {
          emitWithLogging(io.to(socketId), "notifications", {
            type: 0,
            data: { users },
          });
        });
      }
    } else {
      const nearbyUsers = await User.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: currentUser.location.coordinates,
            },
            distanceField: "distance",
            spherical: true,
            query: {
              _id: { $ne: mongoose.Types.ObjectId(userId) },
            },
          },
        },
        {
          $limit: 5,
        },
        {
          $sort: {
            distance: 1,
          },
        },
        {
          $project: {
            _id: 1,
            avatar: 1,
            username: 1,
            location: 1,
          },
        },
      ]);

      const users = nearbyUsers.map((user) => ({
        userId: user._id,
        avatarUrl: user.avatar,
        username: user.username,
        distance:
          user.location && user.location.coordinates
            ? calculateDistance(
                currentUser.location.coordinates,
                user.location.coordinates
              )
            : null,
      }));
      if (userIdSocketMap[userId]) {
        userIdSocketMap[userId].forEach((socketId) => {
          emitWithLogging(io.to(socketId), "notifications", {
            type: 0,
            data: { users },
          });
        });
      }
    }
  } catch (error) {
    errorMonitoringService.monitorError(error).then();
    console.error("Error in nearbyUsers socket controller:", error);
  }
};
