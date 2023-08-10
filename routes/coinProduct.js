const express = require("express");
const auth = require("../middlewares/auth");
const coinProductController = require("../controllers/coinProduct");

const router = express.Router();

// 金币商品路由
router.get("/products/coins", auth, coinProductController.getCoinProductList);
router.post(
  "/products/coins/:productId/buy",
  auth,
  coinProductController.buyCoinProduct
);

module.exports = router;
