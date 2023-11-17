const mongoose = require("mongoose");
const InteractionNotification = require("../models/InteractionNotification");
const StatusNotification = require("../models/StatusNotification");
const GiftNotification = require("../models/GiftNotification");
const SystemNotification = require("../models/SystemNotification");

exports.getInteractionNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const userId = req.user.userId;

    const notifications = await InteractionNotification.find({ toUser: userId })
      .populate("user", "id username avatar")
      .populate("post", "id images")
      .populate({
        path: "post",
        populate: { path: "author", select: "id username" },
      })
      .populate("comment", "id")
      .sort({ interactionTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const formattedNotifications = notifications.map((notification) => {
      const {
        id,
        interactionType,
        interactionTime,
        readStatus,
        post,
        user,
        comment,
      } = notification;
      const { images, author } = post;
      const postImage = images[0];
      const { avatar } = user;
      const commentId = comment ? comment.id : undefined;
      return {
        notificationId: id,
        userAvatar: avatar,
        userId: user.id,
        username: user.username,
        interactionType,
        interactionTime: Math.floor(interactionTime.getTime() / 1000),
        postId: post.id,
        postAuthorId: author.id, // 帖子作者的 ID
        postAuthorName: author.username, // 帖子作者的用户名
        postImage,
        readStatus: readStatus ? 1 : 0,
        commentId,
      };
    });

    res.status(200).json(formattedNotifications);
  } catch (error) {
    next(error);
  }
};

exports.markInteractionNotificationAsRead = async (req, res, next) => {
  const { notificationId } = req.params;

  try {
    // 验证 notificationId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(404).json({ message: "交互类通知不存在" });
    }

    // 检查交互类通知是否存在
    const notification = await InteractionNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "交互类通知不存在" });
    }

    // 检查当前用户是否有权限标记该通知为已读
    if (notification.toUser.toString() !== req.user.userId) {
      return res.status(403).json({ message: "无权限标记该通知为已读" });
    }

    notification.readStatus = 1; // 将通知标记为已读
    await notification.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

exports.getStatusNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const userId = req.user.userId;

    const notifications = await StatusNotification.find({ toUser: userId })
      .populate("user", "id username avatar")
      .sort({ statusTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const formattedNotifications = notifications.map((notification) => {
      const { id, statusType, statusTime, readStatus, user } = notification;
      const { avatar } = user;
      return {
        notificationId: id,
        userAvatar: avatar,
        userId: user.id,
        username: user.username,
        statusType,
        statusTime: Math.floor(statusTime.getTime() / 1000),
        readStatus: readStatus ? 1 : 0,
      };
    });

    res.status(200).json(formattedNotifications);
  } catch (error) {
    next(error);
  }
};

exports.markStatusNotificationAsRead = async (req, res, next) => {
  const { notificationId } = req.params;

  try {
    // 验证 notificationId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(404).json({ message: "状态类通知不存在" });
    }

    // 检查状态类通知是否存在
    const notification = await StatusNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "状态类通知不存在" });
    }

    // 检查当前用户是否有权限标记该通知为已读
    if (notification.toUser.toString() !== req.user.userId) {
      return res.status(403).json({ message: "无权限标记该通知为已读" });
    }

    notification.readStatus = 1; // 将通知标记为已读
    await notification.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

exports.getGiftNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const userId = req.user.userId;

    const notifications = await GiftNotification.find({ toUser: userId })
      .populate("user", "id username avatar")
      .sort({ giftTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const formattedNotifications = notifications.map((notification) => {
      const { id, giftQuantity, giftName, giftTime, readStatus, user } =
        notification;
      const { avatar } = user;
      return {
        notificationId: id,
        userAvatar: avatar,
        userId: user.id,
        username: user.username,
        giftQuantity,
        giftName,
        giftTime: Math.floor(giftTime.getTime() / 1000),
        readStatus: readStatus ? 1 : 0,
      };
    });

    res.status(200).json(formattedNotifications);
  } catch (error) {
    next(error);
  }
};

exports.markGiftNotificationAsRead = async (req, res, next) => {
  const { notificationId } = req.params;

  try {
    // 验证 notificationId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(404).json({ message: "礼物类通知不存在" });
    }

    // 检查礼物类通知是否存在
    const notification = await GiftNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "礼物类通知不存在" });
    }

    // 检查当前用户是否有权限标记该通知为已读
    if (notification.toUser.toString() !== req.user.userId) {
      return res.status(403).json({ message: "无权限标记该通知为已读" });
    }

    notification.readStatus = 1; // 将通知标记为已读
    await notification.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

exports.getSystemNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const userId = req.user.userId;

    const notifications = await SystemNotification.find({ toUser: userId })
      .sort({ notificationTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const formattedNotifications = notifications.map((notification) => {
      const {
        id,
        notificationType,
        notificationTitle,
        notificationContent,
        notificationTime,
        readStatus,
      } = notification;
      return {
        notificationId: id,
        notificationType,
        notificationTitle,
        notificationContent,
        notificationTime: Math.floor(notificationTime.getTime() / 1000),
        readStatus: readStatus ? 1 : 0,
      };
    });

    res.status(200).json(formattedNotifications);
  } catch (error) {
    next(error);
  }
};

exports.markSystemNotificationAsRead = async (req, res, next) => {
  const { notificationId } = req.params;

  try {
    // 验证 notificationId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(404).json({ message: "系统类通知不存在" });
    }

    // 检查系统类通知是否存在
    const notification = await SystemNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "系统类通知不存在" });
    }

    // 检查当前用户是否有权限标记该通知为已读
    if (notification.toUser.toString() !== req.user.userId) {
      return res.status(403).json({ message: "无权限标记该通知为已读" });
    }

    notification.readStatus = 1; // 将通知标记为已读
    await notification.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};
