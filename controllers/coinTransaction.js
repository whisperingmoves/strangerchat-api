const CoinTransaction = require('../models/CoinTransaction');
const moment = require("moment");

const getCoinTransactionList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        let query = { userId: req.user.userId };
        const dateString = req.query.date;
        if (dateString) {
            const startOfDay = moment(dateString).startOf('day').toDate();
            const endOfDay = moment(dateString).endOf('day').toDate();
            query.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        const coinTransactions = await CoinTransaction.find(query)
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const formattedCoinTransactions = coinTransactions.map((coinTransaction) => ({
            id: coinTransaction._id.toString(),
            createdAt: Math.floor(coinTransaction.createdAt.getTime() / 1000),
            currency: coinTransaction.currency,
            amount: coinTransaction.amount,
        }));

        res.status(200).json(formattedCoinTransactions);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCoinTransactionList,
}
