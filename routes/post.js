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
const auth = require("../middlewares/auth");
const uploadAuth = require("../middlewares/uploadAuth");
const postController = require("../controllers/post");
const commentController = require("../controllers/comment");
const multer = require("multer");
const path = require("path");
const config = require("../config");
const { getCurrentDate } = require("../utils/dateUtils");
const { mkdirSync } = require("fs");

const router = express.Router();

const uploadPostStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(config.postUploadPath, getCurrentDate()); // 设置上传路径
    mkdirSync(uploadPath, { recursive: true }); // 创建日期子目录
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExt);
  },
});

const uploadPost = multer({ storage: uploadPostStorage }).single("post");

// 帖子路由
router.post("/uploadPost", uploadAuth, uploadPost, postController.uploadPost);
router.post("/posts", auth, postController.createPost);
router.post("/posts/:postId/heat", auth, postController.heatPost);
router.post("/posts/:postId/like", auth, postController.likePost);
router.post("/posts/:postId/collect", auth, postController.collectPost);
router.post("/posts/:postId/share", auth, postController.sharePost);
router.post("/posts/:postId/comment", auth, commentController.createComment);
router.get("/posts/follows", auth, postController.getFollowedUsersPosts);
router.get("/posts/recommended", auth, postController.getRecommendedPosts);
router.get("/posts/latest", auth, postController.getLatestPosts);
router.get("/posts/hot", auth, postController.getHotPosts);
router.get("/posts/:postId", auth, postController.getPostDetails);
router.get("/posts/:postId/comments", auth, commentController.getPostComments);

module.exports = router;
