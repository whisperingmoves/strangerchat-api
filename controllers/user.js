const User = require('../models/User');
const config = require('../config');
const path = require("path");

const register = async (req, res) => {
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

    await user.save();

    // 生成JWT token
    const token = jwt.sign({ userId: user.id });

    res.json({
        token,
        userId: user.id
    });
}

const uploadAvatar = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).send('请选择文件上传');
        }

        const avatar = req.file;
        const fileName = avatar.filename;

        // 保存图片到本地
        // const targetPath = path.join(config.avatarUploadPath, fileName);
        // avatar.mv(targetPath);

        const url = '/uploads/avatars/' + fileName;

        res.json({ url });

    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports = {
    register,
    uploadAvatar
}
