const mongoose = require('mongoose');

const voiceCallRecordSchema = new mongoose.Schema({
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
});

voiceCallRecordSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('VoiceCallRecord', voiceCallRecordSchema);
