const CoinTransaction = require("../../models/CoinTransaction");

const createCoinTransaction = async (req, res, next) => {
  try {
    const { userId, coins, amount, currency, paymentMethod, transactionId } =
      req.body;

    const coinTransaction = await CoinTransaction.create({
      userId,
      coins,
      amount,
      currency,
      paymentMethod,
      transactionId,
    });

    res.status(201).json({ id: coinTransaction.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCoinTransaction,
};
