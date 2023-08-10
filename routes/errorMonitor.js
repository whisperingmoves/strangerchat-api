const express = require("express");
const monitorAuth = require("../middlewares/monitorAuth");
const errorMonitorController = require("../controllers/errorMonitor");

const router = express.Router();

// 监控路由
router.post("/monitor/error", monitorAuth, errorMonitorController.monitorError);

module.exports = router;
