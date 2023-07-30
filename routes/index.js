const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config');

const upload = multer({
    dest: config.avatarUploadPath // 设置上传路径
});

const verificationController = require('../controllers/verification');
const userController = require('../controllers/user');

// 验证码路由
router.post('/verifications/sendCode', verificationController.sendVerificationCode);
router.post('/verifications/verifyCode', verificationController.verifyVerificationCode);

// 用户路由
router.post('/users/register', userController.register);
router.post('/uploadAvatar', upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
