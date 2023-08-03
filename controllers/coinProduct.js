const CoinProduct = require('../models/CoinProduct');
const CoinTransaction = require('../models/CoinTransaction');
const User = require('../models/User');
const PaymentService = require('../services/PaymentService');
const mongoose = require("mongoose");

const getCoinProductList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        let coinProducts = await CoinProduct.find({})
            .skip(skip)
            .limit(pageSize)
            .select('-__v')
            .lean();

        coinProducts = coinProducts.map(coinProduct => ({
            productId: coinProduct._id,
            coins: coinProduct.coins,
            originalPrice: coinProduct.originalPrice,
            price: coinProduct.price,
            currency: coinProduct.currency,
        }));

        res.status(200).json(coinProducts);
    } catch (error) {
        next(error);
    }
};

const buyCoinProduct = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const receipt = req.body.receipt;

        // 验证 productId 是否是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(404).json({ message: '金币商品不存在' });
        }

        // 检查 receipt 是否存在
        if (!receipt) {
            return res.status(400).json({ message: '缺少凭据信息' });
        }

        // 查找金币商品
        const coinProduct = await CoinProduct.findById(productId);
        if (!coinProduct) {
            return res.status(404).json({ message: '金币商品不存在' });
        }

        // 调用第三方支付服务验证凭据并获取交易信息
        const transaction = await PaymentService.verifyReceipt(receipt);

        // 创建金币交易记录
        const userId = req.user.userId;
        const coinCount = coinProduct.coins;
        const transactionData = {
            userId,
            coins: coinCount,
            amount: transaction.amount,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod,
            transactionId: transaction.transactionId,
        };
        const coinTransaction = new CoinTransaction(transactionData);
        await coinTransaction.save();

        // 更新用户金币余额
        const user = await User.findById(userId);
        user.coinBalance += coinCount;
        await user.save();

        res.status(200).json({ message: '购买成功' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCoinProductList,
    buyCoinProduct,
}
