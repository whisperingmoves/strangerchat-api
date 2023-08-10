const express = require("express");
const path = require("path");
const multer = require("multer");
const config = require("../config");
const uploadAuth = require("../middlewares/uploadAuth");
const publishBundleAuth = require("../middlewares/publishBundleAuth");
const refreshBundleAuth = require("../middlewares/refreshBundleAuth");
const bundleController = require("../controllers/bundle");
const { mkdirSync } = require("fs");
const { getCurrentDate } = require("../utils/dateUtils");

const router = express.Router();

const uploadBundleStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(config.bundleUploadPath, getCurrentDate()); // 设置上传路径
    mkdirSync(uploadPath, { recursive: true }); // 创建日期子目录
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 将保存到服务器的文件名设置为原文件名
  },
});

const uploadBundle = multer({ storage: uploadBundleStorage }).single("bundle");

// Bundle 路由
router.post(
  "/uploadBundle",
  uploadAuth,
  uploadBundle,
  bundleController.uploadBundle
);
router.post(
  "/bundles/publish",
  publishBundleAuth,
  bundleController.publishBundle
);
router.get(
  "/bundles/refresh",
  refreshBundleAuth,
  bundleController.refreshBundle
);

module.exports = router;
