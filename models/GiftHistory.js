const mongoose = require("mongoose");

const giftHistorySchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gift",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

giftHistorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

giftHistorySchema.statics.getReceivedGiftCount = async function (
  userId,
  startDate,
  endDate
) {
  return await this.aggregate([
    {
      $match: {
        receiver: mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$sender",
        count: { $sum: "$quantity" },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 7,
    },
  ]);
};

module.exports = mongoose.model("GiftHistory", giftHistorySchema);
