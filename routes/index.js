const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config');

const uploadAvatar = multer({
    dest: config.avatarUploadPath // 设置上传路径
});
const uploadPosts = multer({
    dest: config.postsUploadPath // 设置上传路径
});

const verificationController = require('../controllers/verification');
const userController = require('../controllers/user');
const postsController = require('../controllers/posts');

// 验证码路由
router.post('/verifications/sendCode', verificationController.sendVerificationCode);
router.post('/verifications/verifyCode', verificationController.verifyVerificationCode);

// 用户路由
router.post('/users/register', userController.register);
router.post('/uploadAvatar', uploadAvatar.single('avatar'), userController.uploadAvatar);

// 帖子路由
router.post('/uploadPosts', uploadPosts.single('posts'), postsController.uploadPosts);


module.exports = router;
