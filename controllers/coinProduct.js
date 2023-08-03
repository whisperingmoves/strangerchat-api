const CoinProduct = require('../models/CoinProduct');

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
            id: coinProduct._id,
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

module.exports = {
    getCoinProductList,
}
