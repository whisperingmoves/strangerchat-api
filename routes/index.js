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

// 验证码路由
router.post('/verifications/sendCode', verificationController.sendVerificationCode);
router.post('/verifications/verifyCode', verificationController.verifyVerificationCode);

// 用户路由
router.post('/users/register', userController.register);
router.post('/uploadAvatar', uploadAvatar.single('avatar'), userController.uploadAvatar);

// 帖子路由
router.post('/uploadPost', uploadPost.single('post'), postController.uploadPost);
router.post('/posts', auth, postController.createPost);
router.post('/posts/:postId/heat', auth, postController.heatPost);
router.post('/posts/:postId/like', auth, postController.likePost);


module.exports = router;
