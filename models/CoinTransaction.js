const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    coins: {
        type: Number,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

coinTransactionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);
