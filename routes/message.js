// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
