const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

adminUserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("AdminUser", adminUserSchema);
