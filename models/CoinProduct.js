const mongoose = require("mongoose");

const coinProductSchema = new mongoose.Schema({
  coins: {
    type: Number,
    required: true,
    min: 1,
    max: 100000,
  },
  originalPrice: {
    type: Number,
    required: false,
    min: 1,
    max: 10000000,
  },
  price: {
    type: Number,
    required: true,
    min: 1,
    max: 10000000,
  },
  currency: {
    type: String,
    required: true,
    maxLength: 10,
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

coinProductSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("CoinProduct", coinProductSchema);
