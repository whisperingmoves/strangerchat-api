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

module.exports = {
  createGiftNotification,
};
