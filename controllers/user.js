const User = require('../models/User');
const StatusNotification = require('../models/StatusNotification');
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
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
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

        const url = '/uploads/avatars/' + fileName;

        res.json({ url });

    } catch(err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
}

const followUser = async (req, res, next) => {
    const { userId } = req.params;
    const { action } = req.query;

    try {
        // 检查被关注用户是否存在
        const followedUser = await User.findById(userId);
        if (!followedUser) {
            return res.status(404).json({ message: '被关注用户不存在' });
        }

        // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
        const followerId = req.user.userId;

        // 根据操作进行关注或取消关注
        const follower = await User.findById(followerId);
        if (action === '1') {
            // 检查被关注用户是否已被关注
            if (follower.following.includes(userId)) {
                return res.status(400).json({ message: '用户已被关注' });
            }

            await follower.followUser(followedUser);
            followedUser.followersCount++;

            // 创建状态类通知
            if (followedUser.id !== followerId) { // 避免给自己发通知
                const notification = new StatusNotification({
                    toUser: followedUser.id,
                    user: followerId,
                    statusType: 0, // 关注用户
                });
                await notification.save();
            }
        } else if (action === '0') {
            // 检查被关注用户是否未被关注
            if (!follower.following.includes(userId)) {
                return res.status(400).json({ message: '用户未被关注，无法取消关注' });
            }

            await follower.unfollowUser(followedUser);
            followedUser.followersCount--;

            // 删除状态类通知
            await StatusNotification.deleteOne({
                toUser: followedUser.id,
                user: followerId,
                statusType: 0,
            });
        } else {
            return res.status(400).json({ message: '无效的关注操作' });
        }

        await followedUser.save();

        res.json({});
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

module.exports = {
    register,
    uploadAvatar,
    followUser,
}
