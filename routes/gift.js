const express = require("express");
const auth = require("../middlewares/auth");
const giftController = require("../controllers/gift");

const router = express.Router();

// 礼物路由
router.get("/gifts", auth, giftController.getGiftList);
router.post("/gifts/send", auth, giftController.sendGift);

module.exports = router;
