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

const deleteCoinTransactions = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await CoinTransaction.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCoinTransaction,
  deleteCoinTransactions,
};
