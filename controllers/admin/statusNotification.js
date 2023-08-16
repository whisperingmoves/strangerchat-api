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

module.exports = {
  createStatusNotification,
};
