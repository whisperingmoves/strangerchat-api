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
