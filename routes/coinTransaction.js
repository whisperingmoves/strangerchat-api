const express = require("express");
const auth = require("../middlewares/auth");
const coinTransactionController = require("../controllers/coinTransaction");

const router = express.Router();

// 金币交易记录路由
router.get(
  "/transactions/coins",
  auth,
  coinTransactionController.getCoinTransactionList
);

module.exports = router;
