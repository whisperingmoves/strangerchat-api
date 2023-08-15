const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const coinTransactionController = require("../../controllers/admin/coinTransaction");

const router = express.Router();

// 金币交易记录路由
router.post(
  "/coinTransactions",
  adminAuth,
  coinTransactionController.createCoinTransaction
);
router.delete(
  "/coinTransactions",
  adminAuth,
  coinTransactionController.deleteCoinTransactions
);
router.get(
  "/coinTransactions",
  adminAuth,
  coinTransactionController.getCoinTransactionList
);

module.exports = router;
