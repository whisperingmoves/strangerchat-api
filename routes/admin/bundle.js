const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const bundleController = require("../../controllers/admin/bundle");

const router = express.Router();

// Bundle 路由
router.post(
  "/bundles/:bundleId/online",
  adminAuth,
  bundleController.onlineBundle
);
router.post("/bundles", adminAuth, bundleController.createBundle);

module.exports = router;
