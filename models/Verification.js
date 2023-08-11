const mongoose = require("mongoose");
const config = require("../config");

const schema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: config.verifyCodeExpires, // 过期时间,单位秒
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Verification", schema);
