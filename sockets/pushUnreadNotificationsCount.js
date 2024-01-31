// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const InteractionNotification = require("../models/InteractionNotification");
const StatusNotification = require("../models/StatusNotification");
const GiftNotification = require("../models/GiftNotification");
const SystemNotification = require("../models/SystemNotification");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

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
        emitWithLogging(io.to(socketId), "notifications", {
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
