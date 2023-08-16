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

module.exports = {
  createInteractionNotification,
  deleteInteractionNotifications,
  getInteractionNotificationList,
};
