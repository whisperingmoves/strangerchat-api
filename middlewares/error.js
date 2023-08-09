const ErrorMonitorService = require("../services/ErrorMonitorService");

const errorMonitoringService = ErrorMonitorService.getInstance();

module.exports = (error, req, res) => {
  errorMonitoringService.monitorError(error).then();
  console.error(error);

  res.status(error.status || 500);
  res.json({
    message: error.message,
  });

  if (process.env.NODE_ENV === "development") {
    res.json({
      message: error.message,
      stack: error.stack,
    });
  }
};
