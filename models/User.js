const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    gender: String,
    birthday: Date,
    avatar: String,
    giftsReceived: { type: Number, default: 0 },
    username: { type: String },
    city: String,
    followingCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    visitorsCount: { type: Number, default: 0 },
    freeHeatsLeft: { type: Number, default: 0},
    coinBalance: { type: Number, default: 0 },
    location: {
        type: {
            type: String,
            default: 'Point' // 'Point' indicating geographic coordinates
        },
        coordinates: [{
            type: Number,
            required: true
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

schema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('User', schema);
