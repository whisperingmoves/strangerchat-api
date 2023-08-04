const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error('请先登录'));

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err) return next(new Error('认证失败'));
        socket.userId = decoded.userId;
        next();
    });
};
