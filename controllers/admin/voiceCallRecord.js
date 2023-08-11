const VoiceCallRecord = require("../../models/VoiceCallRecord");

const createVoiceCallRecord = async (req, res, next) => {
  try {
    const { callerId, recipientId, startTime, endTime } = req.body;

    const voiceCallRecord = await VoiceCallRecord.create({
      callerId,
      recipientId,
      startTime,
      endTime,
    });

    res.status(201).json({ id: voiceCallRecord.id });
  } catch (error) {
    next(error);
  }
};

const deleteVoiceCallRecords = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await VoiceCallRecord.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVoiceCallRecord,
  deleteVoiceCallRecords,
};
