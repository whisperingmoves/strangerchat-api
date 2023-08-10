const express = require("express");

const router = express.Router();

// 其他路由
router.get("/health", (req, res) => {
  res.sendStatus(200);
});

module.exports = router;
