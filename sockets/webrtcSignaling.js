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

const ErrorMonitorService = require("../services/ErrorMonitorService");
const emitWithLogging = require("../middlewares/emitWithLogging");

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
        emitWithLogging(io.to(socketId), "notifications", {
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
