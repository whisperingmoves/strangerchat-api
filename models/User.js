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
    freeHeatsLeft: { type: Number, default: 3},
    coinBalance: { type: Number, default: 0 },
    checkedDays: { type: Number, default: 0 }, // 连续签到的天数
    lastCheckDate: { type: Date }, // 上次签到的日期
    location: {
        type: {
            type: String,
            default: 'Point' // 'Point' indicating geographic coordinates
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

schema.virtual('id').get(function () {
    return this._id.toHexString();
});

schema.methods.followUser = async function (userId) {
    if (this.following.indexOf(userId) === -1) {
        this.following.push(userId);
        this.followingCount++;
        await this.save();
    }
};

schema.methods.unfollowUser = async function (userId) {
    const index = this.following.indexOf(userId);
    if (index !== -1) {
        this.following.splice(index, 1);
        this.followingCount--;
        await this.save();
    }
};

module.exports = mongoose.model('User', schema);
