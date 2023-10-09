const mongoose = require("mongoose");

const userReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
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

userReportSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("UserReport", userReportSchema);
