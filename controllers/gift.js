const Gift = require('../models/Gift');

const getGiftList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        let gifts = await Gift.find({})
            .skip(skip)
            .limit(pageSize)
            .select('-__v')
            .lean();

        gifts = gifts.map(gift => ({
            id: gift._id,
            image: gift.image,
            name: gift.name,
            value: gift.value,
        }))

        res.status(200).json(gifts);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGiftList,
};