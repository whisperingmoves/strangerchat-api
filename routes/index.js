const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config');
const auth = require('../middlewares/auth')

const uploadAvatar = multer({
    dest: config.avatarUploadPath // 设置上传路径
});
const uploadPost = multer({
    dest: config.postUploadPath // 设置上传路径
});

const verificationController = require('../controllers/verification');
const userController = require('../controllers/user');
const postController = require('../controllers/post');
const commentController = require('../controllers/comment');
const storyController = require('../controllers/story');
const notificationController = require('../controllers/notification');

// 验证码路由
router.post('/verifications/sendCode', verificationController.sendVerificationCode);
router.post('/verifications/verifyCode', verificationController.verifyVerificationCode);

// 用户路由
router.post('/users/register', userController.register);
router.post('/uploadAvatar', uploadAvatar.single('avatar'), userController.uploadAvatar);
router.get('/users/me/posts', auth, postController.getMyPosts);
router.get('/users/me/posts/:postId', auth, postController.getMyPostDetails);
router.post('/users/:userId/follow', auth, userController.followUser);

// 故事路由
router.get('/stories', auth, storyController.getStoryList);

// 帖子路由
router.post('/uploadPost', uploadPost.single('post'), postController.uploadPost);
router.post('/posts', auth, postController.createPost);
router.post('/posts/:postId/heat', auth, postController.heatPost);
router.post('/posts/:postId/like', auth, postController.likePost);
router.post('/posts/:postId/collect', auth, postController.collectPost);
router.post('/posts/:postId/share', auth, postController.sharePost);
router.post('/posts/:postId/comment', auth, commentController.createComment);
router.get('/posts/follows', auth, postController.getFollowedUsersPosts);
router.get('/posts/recommended', auth, postController.getRecommendedPosts);
router.get('/posts/latest', auth, postController.getLatestPosts);
router.get('/posts/hot', auth, postController.getHotPosts);
router.get('/posts/:postId', auth, postController.getPostDetails);
router.get('/posts/:postId/comments', auth, commentController.getPostComments);

// 评论路由
router.delete('/comments/:commentId', auth, commentController.deleteComment);
router.post('/comments/:commentId/like', auth, commentController.likeComment);
router.get('/comments/:commentId/replies', auth, commentController.getCommentReplies);

// 通知路由
router.get('/notifications/interaction', auth, notificationController.getInteractionNotifications);
router.patch('/notifications/interaction/:notificationId/read', auth, notificationController.markInteractionNotificationAsRead);
router.get('/notifications/status', auth, notificationController.getStatusNotifications);
router.patch('/notifications/status/:notificationId/read', auth, notificationController.markStatusNotificationAsRead);
router.get('/notifications/gift', auth, notificationController.getGiftNotifications);
router.patch('/notifications/gift/:notificationId/read', auth, notificationController.markGiftNotificationAsRead);
router.get('/notifications/system', auth, notificationController.getSystemNotifications);
router.patch('/notifications/system/:notificationId/read', auth, notificationController.markSystemNotificationAsRead);

module.exports = router;
