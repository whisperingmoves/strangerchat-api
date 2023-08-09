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
