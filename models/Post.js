const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    city: {
        type: String,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    images: [{
        type: String
    }],
    visibility: {
        type: Number,
        enum: [0, 1, 2],
        default: 0
    },
    atUsers: [{
        type: String
    }],
    heatCount: {
        type: Number,
        default: 0
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    collects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    shares: [{
        sharePlatform: {
            type: Number,
            enum: [1, 2, 3],
            required: true
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

postSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Post', postSchema);
