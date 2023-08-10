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
