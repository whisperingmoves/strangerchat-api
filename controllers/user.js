const User = require('../models/User');
const {sign} = require("jsonwebtoken");
const config = require('../config');

const register = async (req, res, next) => {
    const { mobile, gender, birthday, avatar, longitude, latitude } = req.body;

    // 校验参数
    if (!mobile || !gender || !birthday || !avatar) {
        return res.status(400).json({ message: '请填写完整信息' })
    }

    // 生成用户对象
    const user = new User({
        mobile,
        gender,
        birthday,
        avatar
    });

    // 保存地理位置(可选)
    if (longitude && latitude) {
        user.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };
    }

    try {
        await user.save();

        // 生成JWT token
        const token = sign({ userId: user.id }, config.jwtSecret);

        res.json({
            token,
            userId: user.id
        });
    } catch (err) {
        if (err.message.includes('duplicate key error')) {
            res.status(400).json({ message: '用户已存在' });
        } else {
            next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
        }
    }
}

const uploadAvatar = async (req, res, next) => {
    try {

        if (!req.file) {
            return res.status(400).json({message: '请选择文件上传'});
        }

        const avatar = req.file;
        const fileName = avatar.filename;

        // 保存图片到本地
        // const targetPath = path.join(config.avatarUploadPath, fileName);
        // avatar.mv(targetPath);

        const url = '/uploads/' + fileName;

        res.json({ url });

    } catch(err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
}

module.exports = {
    register,
    uploadAvatar
}
