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

module.exports = {
  createStatusNotification,
  deleteStatusNotifications,
  getStatusNotificationList,
};
