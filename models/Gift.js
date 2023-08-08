const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    maxLength: 50,
  },
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 10000,
  },
});

giftSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Gift", giftSchema);
