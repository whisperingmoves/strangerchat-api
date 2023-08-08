const express = require("express");
const path = require("path");
const multer = require("multer");
const config = require("../config");
const auth = require("../middlewares/auth");
const uploadAuth = require("../middlewares/uploadAuth");
const publishBundleAuth = require("../middlewares/publishBundleAuth");
const refreshBundleAuth = require("../middlewares/refreshBundleAuth");
const verificationController = require("../controllers/verification");
const userController = require("../controllers/user");
const postController = require("../controllers/post");
const commentController = require("../controllers/comment");
const storyController = require("../controllers/story");
const notificationController = require("../controllers/notification");
const giftController = require("../controllers/gift");
const coinProductController = require("../controllers/coinProduct");
const coinTransactionController = require("../controllers/coinTransaction");
const bundleController = require("../controllers/bundle");
const { mkdirSync } = require("fs");
const { getCurrentDate } = require("../utils/dateUtils");

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

const uploadAvatar = multer({ storage: uploadAvatarStorage }).single("avatar");
const uploadPost = multer({ storage: uploadPostStorage }).single("post");
const uploadBundle = multer({ storage: uploadBundleStorage }).single("bundle");

// 验证码路由
router.post(
  "/verifications/sendCode",
  verificationController.sendVerificationCode
);
router.post(
  "/verifications/verifyCode",
  verificationController.verifyVerificationCode
);

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

// 故事路由
router.get("/stories", auth, storyController.getStoryList);

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

// 评论路由
router.delete("/comments/:commentId", auth, commentController.deleteComment);
router.post("/comments/:commentId/like", auth, commentController.likeComment);
router.get(
  "/comments/:commentId/replies",
  auth,
  commentController.getCommentReplies
);

// 通知路由
router.get(
  "/notifications/interaction",
  auth,
  notificationController.getInteractionNotifications
);
router.patch(
  "/notifications/interaction/:notificationId/read",
  auth,
  notificationController.markInteractionNotificationAsRead
);
router.get(
  "/notifications/status",
  auth,
  notificationController.getStatusNotifications
);
router.patch(
  "/notifications/status/:notificationId/read",
  auth,
  notificationController.markStatusNotificationAsRead
);
router.get(
  "/notifications/gift",
  auth,
  notificationController.getGiftNotifications
);
router.patch(
  "/notifications/gift/:notificationId/read",
  auth,
  notificationController.markGiftNotificationAsRead
);
router.get(
  "/notifications/system",
  auth,
  notificationController.getSystemNotifications
);
router.patch(
  "/notifications/system/:notificationId/read",
  auth,
  notificationController.markSystemNotificationAsRead
);

// 礼物路由
router.get("/gifts", auth, giftController.getGiftList);
router.post("/gifts/send", auth, giftController.sendGift);

// 商品路由
router.get("/products/coins", auth, coinProductController.getCoinProductList);
router.post(
  "/products/coins/:productId/buy",
  auth,
  coinProductController.buyCoinProduct
);

// 交易路由
router.get(
  "/transactions/coins",
  auth,
  coinTransactionController.getCoinTransactionList
);

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
router.post("/bundles/:bundleId/online", bundleController.onlineBundle);
router.get(
  "/bundles/refresh",
  refreshBundleAuth,
  bundleController.refreshBundle
);

// 其他路由
router.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

module.exports = router;
