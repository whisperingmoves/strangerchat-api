const GiftHistory = require("../../models/GiftHistory");

const createGiftHistory = async (req, res, next) => {
  try {
    const { sender, receiver, gift, quantity } = req.body;

    const giftHistory = await GiftHistory.create({
      sender,
      receiver,
      gift,
      quantity,
    });

    res.status(201).json({ id: giftHistory.id });
  } catch (error) {
    next(error);
  }
};

const deleteGiftHistories = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await GiftHistory.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGiftHistory,
  deleteGiftHistories,
};
