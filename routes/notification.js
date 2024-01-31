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

const express = require("express");
const auth = require("../middlewares/auth");
const notificationController = require("../controllers/notification");

const router = express.Router();

// 通知路由
router.get(
  "/notifications/interaction",
  auth,
  notificationController.getInteractionNotifications
);
router.patch(
  "/notifications/interaction/:notificationId/read",
  auth,
  notificationController.markInteractionNotificationAsRead
);
router.get(
  "/notifications/status",
  auth,
  notificationController.getStatusNotifications
);
router.patch(
  "/notifications/status/:notificationId/read",
  auth,
  notificationController.markStatusNotificationAsRead
);
router.get(
  "/notifications/gift",
  auth,
  notificationController.getGiftNotifications
);
router.patch(
  "/notifications/gift/:notificationId/read",
  auth,
  notificationController.markGiftNotificationAsRead
);
router.get(
  "/notifications/system",
  auth,
  notificationController.getSystemNotifications
);
router.patch(
  "/notifications/system/:notificationId/read",
  auth,
  notificationController.markSystemNotificationAsRead
);

module.exports = router;
