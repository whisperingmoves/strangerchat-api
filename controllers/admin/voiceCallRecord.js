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

const getVoiceCallRecords = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      callerId,
      recipientId,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (callerId) filter["callerId"] = callerId;
    if (recipientId) filter["recipientId"] = recipientId;

    const [total, voiceCallRecords] = await Promise.all([
      VoiceCallRecord.countDocuments(filter),
      VoiceCallRecord.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("callerId", "username")
        .populate("recipientId", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedVoiceCallRecords = voiceCallRecords.map((record) => ({
      id: record._id,
      caller: {
        id: record.callerId._id,
        username: record.callerId.username,
      },
      recipient: {
        id: record.recipientId._id,
        username: record.recipientId.username,
      },
      startTime: record.startTime,
      endTime: record.endTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedVoiceCallRecords,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVoiceCallRecord,
  deleteVoiceCallRecords,
  getVoiceCallRecords,
};
