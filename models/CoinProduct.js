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
