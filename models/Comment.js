const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

commentSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Comment', commentSchema);