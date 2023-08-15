const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const errorMonitorController = require("../../controllers/admin/errorMonitor");

const router = express.Router();

// 错误监控路由
router.get(
  "/errorMonitors",
  adminAuth,
  errorMonitorController.getErrorMonitorList
);

module.exports = router;
