const CoinProduct = require('../../models/CoinProduct');

const createCoinProduct = async (req, res, next) => {
    try {
        const { coins, originalPrice, price, currency } = req.body;

        const coinProduct = await CoinProduct.create({
            coins,
            originalPrice,
            price,
            currency,
        });

        res.status(201).json({ id: coinProduct.id });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCoinProduct,
}