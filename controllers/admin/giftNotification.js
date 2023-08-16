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

module.exports = {
  createGiftNotification,
  deleteGiftNotifications,
};
