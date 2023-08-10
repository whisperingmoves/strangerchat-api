const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const giftController = require("../../controllers/admin/gift");

const router = express.Router();

// 礼物路由
router.post("/gifts", adminAuth, giftController.createGift);
router.delete("/gifts", adminAuth, giftController.deleteGifts);
router.get("/gifts", adminAuth, giftController.getGiftList);
router.put("/gifts/:giftId", adminAuth, giftController.updateGift);

module.exports = router;
