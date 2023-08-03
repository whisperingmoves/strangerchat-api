const mongoose = require('mongoose');

const giftHistorySchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    gift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gift',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

giftHistorySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('GiftHistory', giftHistorySchema);