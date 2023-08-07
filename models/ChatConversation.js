const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema({
    userId1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userId2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lastMessageTime: {
        type: Date,
    },
    lastMessageContent: {
        type: String,
    },
});

chatConversationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
