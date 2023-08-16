const SystemNotification = require("../../models/SystemNotification");

const createSystemNotification = async (req, res, next) => {
  try {
    const {
      toUser,
      notificationTitle,
      notificationContent,
      notificationTime,
      readStatus,
    } = req.body;

    const systemNotification = await SystemNotification.create({
      toUser,
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

module.exports = {
  createSystemNotification,
  deleteSystemNotifications,
};
