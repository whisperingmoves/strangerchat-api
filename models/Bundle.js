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
    enum: [0, 1], // 是否在线 (0: 否, 1: 是, 默认值: 0)
    default: 0,
  },
});

bundleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Bundle", bundleSchema);
