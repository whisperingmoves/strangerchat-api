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

const InteractionNotification = require("../../models/InteractionNotification");

const createInteractionNotification = async (req, res, next) => {
  try {
    const {
      toUser,
      user,
      interactionType,
      post,
      comment,
      interactionTime,
      readStatus,
    } = req.body;

    const interactionNotification = await InteractionNotification.create({
      toUser,
      user,
      interactionType,
      post,
      comment,
      interactionTime,
      readStatus,
    });

    res.status(201).json({ id: interactionNotification.id });
  } catch (error) {
    next(error);
  }
};

const deleteInteractionNotifications = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await InteractionNotification.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getInteractionNotificationList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      toUser,
      user,
      interactionType,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (toUser) filter["toUser"] = toUser;
    if (user) filter["user"] = user;
    if (interactionType) filter["interactionType"] = interactionType;

    const [total, interactionNotifications] = await Promise.all([
      InteractionNotification.countDocuments(filter),
      InteractionNotification.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("toUser", "username")
        .populate("user", "username")
        .populate("post", "_id")
        .select("-__v")
        .lean(),
    ]);

    const formattedInteractionNotifications = interactionNotifications.map(
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
        interactionType: notification.interactionType,
        post: notification.post._id,
        comment: notification.comment ? notification.comment._id : undefined,
        interactionTime: notification.interactionTime,
        readStatus: notification.readStatus,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      })
    );

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedInteractionNotifications,
    });
  } catch (error) {
    next(error);
  }
};

const updateInteractionNotification = async (req, res, next) => {
  try {
    const { interactionNotificationId } = req.params;
    const {
      toUser,
      user,
      interactionType,
      post,
      comment,
      interactionTime,
      readStatus,
    } = req.body;

    const interactionNotification =
      await InteractionNotification.findByIdAndUpdate(
        interactionNotificationId,
        {
          toUser,
          user,
          interactionType,
          post,
          comment,
          interactionTime,
          readStatus,
          updatedAt: Date.now(),
        },
        { new: true }
      );

    if (!interactionNotification) {
      return res.status(404).json({ message: "交互类通知不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInteractionNotification,
  deleteInteractionNotifications,
  getInteractionNotificationList,
  updateInteractionNotification,
};
