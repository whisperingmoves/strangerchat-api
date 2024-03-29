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

const GiftNotification = require("../../models/GiftNotification");

const createGiftNotification = async (req, res, next) => {
  try {
    const { toUser, user, giftQuantity, giftName, giftTime, readStatus } =
      req.body;

    const giftNotification = await GiftNotification.create({
      toUser,
      user,
      giftQuantity,
      giftName,
      giftTime,
      readStatus,
    });

    res.status(201).json({ id: giftNotification.id });
  } catch (error) {
    next(error);
  }
};

const deleteGiftNotifications = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await GiftNotification.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getGiftNotificationList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      toUser,
      user,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (toUser) filter["toUser"] = toUser;
    if (user) filter["user"] = user;

    const [total, giftNotifications] = await Promise.all([
      GiftNotification.countDocuments(filter),
      GiftNotification.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("toUser", "username")
        .populate("user", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedGiftNotifications = giftNotifications.map(
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
        giftQuantity: notification.giftQuantity,
        giftName: notification.giftName,
        giftTime: notification.giftTime,
        readStatus: notification.readStatus,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      })
    );

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedGiftNotifications,
    });
  } catch (error) {
    next(error);
  }
};

const updateGiftNotification = async (req, res, next) => {
  try {
    const { giftNotificationId } = req.params;
    const { toUser, user, giftQuantity, giftName, giftTime, readStatus } =
      req.body;

    const giftNotification = await GiftNotification.findByIdAndUpdate(
      giftNotificationId,
      {
        toUser,
        user,
        giftQuantity,
        giftName,
        giftTime,
        readStatus,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!giftNotification) {
      return res.status(404).json({ message: "礼物类通知不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGiftNotification,
  deleteGiftNotifications,
  getGiftNotificationList,
  updateGiftNotification,
};
