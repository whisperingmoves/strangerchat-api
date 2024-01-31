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
const config = require("../config");

const monitorConnection = mongoose.createConnection(config.monitorDbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const errorMonitorSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  errorMessage: { type: String, required: true },
  stackTrace: { type: String, required: true },
  appVersion: { type: String },
  ipAddress: { type: String },
  runtimeName: { type: String },
  runtimeVersion: { type: String },
  appStartTime: { type: Date },
  appMemory: { type: Number },
  browserName: { type: String },
  browserVersion: { type: String },
  locale: { type: String },
  timezone: { type: String },
  operatingSystemName: { type: String },
  operatingSystemVersion: { type: String },
  occurredFile: { type: String },
  occurredLine: { type: Number },
  occurredFunction: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

errorMonitorSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

const ErrorMonitor = monitorConnection.model(
  "ErrorMonitor",
  errorMonitorSchema
);

module.exports = ErrorMonitor;
