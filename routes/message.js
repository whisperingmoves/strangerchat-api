const express = require("express");
const uploadAuth = require("../middlewares/uploadAuth");
const messageController = require("../controllers/message");
const multer = require("multer");
const path = require("path");
const config = require("../config");
const { getCurrentDate } = require("../utils/dateUtils");
const { mkdirSync } = require("fs");

const router = express.Router();

const uploadMessageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(config.messageUploadPath, getCurrentDate()); // 设置上传路径
    mkdirSync(uploadPath, { recursive: true }); // 创建日期子目录
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExt);
  },
});

const uploadMessage = multer({ storage: uploadMessageStorage }).single(
  "message"
);

// 消息路由
router.post(
  "/uploadMessage",
  uploadAuth,
  uploadMessage,
  messageController.uploadMessage
);

module.exports = router;
