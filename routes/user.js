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
router.get("/users/:userId/posts", auth, postController.getUserPosts);
router.get("/users/me/posts/:postId", auth, postController.getMyPostDetails);
router.post("/users/:userId/follow", auth, userController.followUser);
router.post("/users/:userId/block", auth, userController.blockUser);
router.post("/users/:userId/report", auth, userController.reportUser);
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
