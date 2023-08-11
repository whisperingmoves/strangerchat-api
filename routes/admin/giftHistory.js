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
router.delete(
  "/giftHistories",
  adminAuth,
  giftHistoryController.deleteGiftHistories
);
router.get(
  "/giftHistories",
  adminAuth,
  giftHistoryController.getGiftHistoryList
);
router.put(
  "/giftHistories/:giftHistoryId",
  adminAuth,
  giftHistoryController.updateGiftHistory
);

module.exports = router;
