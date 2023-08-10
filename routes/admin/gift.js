const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const giftController = require("../../controllers/admin/gift");

const router = express.Router();

// 礼物路由
router.post("/admin/gifts", adminAuth, giftController.createGift);
router.delete("/admin/gifts", adminAuth, giftController.deleteGifts);
router.get("/admin/gifts", adminAuth, giftController.getGiftList);
router.put("/admin/gifts/:giftId", adminAuth, giftController.updateGift);

module.exports = router;
