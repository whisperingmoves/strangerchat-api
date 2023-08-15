const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const coinProductController = require("../../controllers/admin/coinProduct");

const router = express.Router();

// 金币商品路由
router.post(
    "/coinProducts",
    adminAuth,
    coinProductController.createCoinProduct
);

module.exports = router;