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

const StatusNotification = require("../../models/StatusNotification");

const createStatusNotification = async (req, res, next) => {
  try {
    const { toUser, user, statusType, statusTime, readStatus } = req.body;

    const statusNotification = await StatusNotification.create({
      toUser,
      user,
      statusType,
      statusTime,
      readStatus,
    });

    res.status(201).json({ id: statusNotification.id });
  } catch (error) {
    next(error);
  }
};

const deleteStatusNotifications = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await StatusNotification.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getStatusNotificationList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      toUser,
      user,
      statusType,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (toUser) filter["toUser"] = toUser;
    if (user) filter["user"] = user;
    if (statusType) filter["statusType"] = statusType;

    const [total, statusNotifications] = await Promise.all([
      StatusNotification.countDocuments(filter),
      StatusNotification.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("toUser", "username")
        .populate("user", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedStatusNotifications = statusNotifications.map(
      (notification) => ({
        id: notification._id,
        toUser: {
          id: notification.toUser._id,
          username: notification.toUser.username,
        },
        user: {
          id: notification.user._id,
          username: notification.user.username,
        },
        statusType: notification.statusType,
        statusTime: notification.statusTime,
        readStatus: notification.readStatus,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      })
    );

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedStatusNotifications,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatusNotification = async (req, res, next) => {
  try {
    const { statusNotificationId } = req.params;
    const { toUser, user, statusType, statusTime, readStatus } = req.body;

    const statusNotification = await StatusNotification.findByIdAndUpdate(
      statusNotificationId,
      {
        toUser,
        user,
        statusType,
        statusTime,
        readStatus,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!statusNotification) {
      return res.status(404).json({ message: "状态类通知不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStatusNotification,
  deleteStatusNotifications,
  getStatusNotificationList,
  updateStatusNotification,
};
