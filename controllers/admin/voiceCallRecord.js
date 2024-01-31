// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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

const updateVoiceCallRecord = async (req, res, next) => {
  try {
    const { callerId, recipientId, startTime, endTime } = req.body;
    const { voiceCallRecordId } = req.params;

    const voiceCallRecord = await VoiceCallRecord.findByIdAndUpdate(
      voiceCallRecordId,
      { callerId, recipientId, startTime, endTime, updatedAt: Date.now() },
      { new: true }
    );

    if (!voiceCallRecord) {
      return res.status(404).json({ message: "语音通话记录不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVoiceCallRecord,
  deleteVoiceCallRecords,
  getVoiceCallRecords,
  updateVoiceCallRecord,
};
