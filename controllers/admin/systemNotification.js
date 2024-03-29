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

const SystemNotification = require("../../models/SystemNotification");

const createSystemNotification = async (req, res, next) => {
  try {
    const {
      toUser,
      notificationType,
      notificationTitle,
      notificationContent,
      notificationTime,
      readStatus,
    } = req.body;

    const systemNotification = await SystemNotification.create({
      toUser,
      notificationType,
      notificationTitle,
      notificationContent,
      notificationTime,
      readStatus,
    });

    res.status(201).json({ id: systemNotification.id });
  } catch (error) {
    next(error);
  }
};

const deleteSystemNotifications = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await SystemNotification.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getSystemNotificationList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      toUser,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (toUser) filter["toUser"] = toUser;

    const [total, systemNotifications] = await Promise.all([
      SystemNotification.countDocuments(filter),
      SystemNotification.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("toUser", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedSystemNotifications = systemNotifications.map(
      (notification) => ({
        id: notification._id,
        toUser: {
          id: notification.toUser._id,
          username: notification.toUser.username,
        },
        notificationType: notification.notificationType,
        notificationTitle: notification.notificationTitle,
        notificationContent: notification.notificationContent,
        notificationTime: notification.notificationTime,
        readStatus: notification.readStatus,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      })
    );

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedSystemNotifications,
    });
  } catch (error) {
    next(error);
  }
};

const updateSystemNotification = async (req, res, next) => {
  try {
    const { systemNotificationId } = req.params;
    const {
      toUser,
      notificationType,
      notificationTitle,
      notificationContent,
      notificationTime,
      readStatus,
    } = req.body;

    const systemNotification = await SystemNotification.findByIdAndUpdate(
      systemNotificationId,
      {
        toUser,
        notificationType,
        notificationTitle,
        notificationContent,
        notificationTime,
        readStatus,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!systemNotification) {
      return res.status(404).json({ message: "系统类通知不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSystemNotification,
  deleteSystemNotifications,
  getSystemNotificationList,
  updateSystemNotification,
};
