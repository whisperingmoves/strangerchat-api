const mongoose = require("mongoose");

const bundleSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  online: {
    type: Number,
    enum: [0, 1], // 是否上线 (0: 否, 1: 是, 默认值: 0)
    default: 0,
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

bundleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Bundle", bundleSchema);
