const express = require("express");
const auth = require("../middlewares/auth");
const uploadAuth = require("../middlewares/uploadAuth");
const userController = require("../controllers/user");
const postController = require("../controllers/post");
const giftController = require("../controllers/gift");
const multer = require("multer");
const path = require("path");
const config = require("../config");
const { getCurrentDate } = require("../utils/dateUtils");
const { mkdirSync } = require("fs");

const router = express.Router();

const uploadAvatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(config.avatarUploadPath, getCurrentDate()); // 设置上传路径
    mkdirSync(uploadPath, { recursive: true }); // 创建日期子目录
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExt);
  },
});

const uploadAvatar = multer({ storage: uploadAvatarStorage }).single("avatar");

// 用户路由
router.post("/users/register", userController.register);
router.post(
  "/uploadAvatar",
  uploadAuth,
  uploadAvatar,
  userController.uploadAvatar
);
router.get("/users/me/posts", auth, postController.getMyPosts);
router.get("/users/me/posts/:postId", auth, postController.getMyPostDetails);
router.post("/users/:userId/follow", auth, userController.followUser);
router.get("/users/following", auth, userController.getFollowingUsers);
router.get("/users/followers", auth, userController.getFollowers);
router.get("/users/friends", auth, userController.getFriends);
router.post("/users/checkin/check", auth, userController.performCheckin);
router.patch("/users/profile", auth, userController.updateUserProfile);
router.get(
  "/users/me/gifts/received",
  auth,
  giftController.getReceivedGiftStats
);
router.get("/users/:userId", auth, userController.getUserDetails);

module.exports = router;
