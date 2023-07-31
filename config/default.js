module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    dbUrl: process.env.MONGO_URL || 'mongodb://localhost/chat',
    verifyCodeExpires: process.env.CODE_EXPIRES || 300, // 验证码有效时间(秒)
    avatarUploadPath: process.env.AVATAR_UPLOAD_PATH || './uploads/avatars/',
    postsUploadPath: process.env.POSTS_UPLOAD_PATH || './uploads/posts/',
    jwtSecret: process.env.JWT_SECRET || 'a long random string',
    generateVerifyCode() { // 生成6位数验证码的函数
        let code = '';
        const characters ='0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 6; i ++) {
            code += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return code;
    }
}
