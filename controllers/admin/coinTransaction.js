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

const getCoinTransactionList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      userId,
      transactionId,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (userId) filter["userId"] = userId;
    if (transactionId) filter["transactionId"] = transactionId;

    const [total, coinTransactions] = await Promise.all([
      CoinTransaction.countDocuments(filter),
      CoinTransaction.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("userId", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedCoinTransactions = coinTransactions.map((transaction) => ({
      id: transaction._id,
      user: {
        id: transaction.userId._id,
        username: transaction.userId.username,
      },
      coins: transaction.coins,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      transactionId: transaction.transactionId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedCoinTransactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCoinTransaction,
  deleteCoinTransactions,
  getCoinTransactionList,
};
