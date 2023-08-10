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

module.exports = {
  createGiftHistory,
};
