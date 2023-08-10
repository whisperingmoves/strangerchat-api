const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const giftHistoryController = require("../../controllers/admin/giftHistory");

const router = express.Router();

// 礼物历史路由
router.post(
  "/giftHistories",
  adminAuth,
  giftHistoryController.createGiftHistory
);

module.exports = router;
