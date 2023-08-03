const User = require('../models/User');
const Post = require('../models/Post');
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

const getFollowingUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const keyword = req.query.keyword;
        const userId = req.user.userId;

        const currentUser = await User.findById(userId).populate('following');

        let query = User.find({ _id: { $in: currentUser.following } }, { avatar: 1, username: 1 })
            .sort({ createdAt: -1 });

        if (keyword) {
            query = query.where('username', new RegExp(keyword, 'i'));
        }

        const users = await query
            .skip(skip)
            .limit(pageSize)
            .lean()
            .exec();

        const userIds = users.map((user) => user._id);

        const latestPosts = await Post.aggregate([
            {
                $match: { author: { $in: userIds } }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$author',
                    latestPost: { $first: '$content' }
                }
            }
        ]);

        const latestPostsMap = new Map(latestPosts.map((post) => [post._id.toString(), post.latestPost]));

        const formattedUsers = users.map((user) => {
            const { _id, avatar, username } = user;
            const latestPostContent = latestPostsMap.get(_id.toString());
            return {
                userId: _id,
                userAvatar: avatar,
                username,
                latestPostContent
            };
        });

        res.status(200).json(formattedUsers);
    } catch (error) {
        next(error);
    }
};

const getFollowers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const keyword = req.query.keyword;
        const userId = req.user.userId;

        const query = User.find({ following: userId }, { avatar: 1, username: 1 })
            .sort({ createdAt: -1 });

        if (keyword) {
            query.where('username', new RegExp(keyword, 'i'));
        }

        const users = await query
            .skip(skip)
            .limit(pageSize)
            .lean()
            .exec();

        const userIds = users.map((user) => user._id);

        const latestPosts = await Post.aggregate([
            {
                $match: { author: { $in: userIds } }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$author',
                    latestPost: { $first: '$content' }
                }
            }
        ]);

        const latestPostsMap = new Map(latestPosts.map((post) => [post._id.toString(), post.latestPost]));

        const formattedUsers = users.map((user) => {
            const { _id, avatar, username } = user;
            const latestPostContent = latestPostsMap.get(_id.toString());
            return {
                userId: _id,
                userAvatar: avatar,
                username,
                latestPostContent
            };
        });

        res.status(200).json(formattedUsers);
    } catch (error) {
        next(error);
    }
};

const getFriends = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const keyword = req.query.keyword;
        const userId = req.user.userId;

        const currentUser = await User.findById(userId).populate('following');

        let query = User.find({ _id: { $in: currentUser.following }, following: userId }, { avatar: 1, username: 1 })
            .sort({ createdAt: -1 });

        if (keyword) {
            query = query.where('username', new RegExp(keyword, 'i'));
        }

        const users = await query
            .skip(skip)
            .limit(pageSize)
            .lean()
            .exec();

        const userIds = users.map((user) => user._id);

        const latestPosts = await Post.aggregate([
            {
                $match: { author: { $in: userIds } }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$author',
                    latestPost: { $first: '$content' }
                }
            }
        ]);

        const latestPostsMap = new Map(latestPosts.map((post) => [post._id.toString(), post.latestPost]));

        const formattedUsers = users.map((user) => {
            const { _id, avatar, username } = user;
            const latestPostContent = latestPostsMap.get(_id.toString());
            return {
                userId: _id,
                userAvatar: avatar,
                username,
                latestPostContent
            };
        });

        res.status(200).json(formattedUsers);
    } catch (error) {
        next(error);
    }
};

const performCheckin = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        // 获取当前日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 检查上次签到日期是否是昨天
        const lastCheckDate = user.lastCheckDate;
        const isYesterday = lastCheckDate && lastCheckDate.getTime() === today.getTime() - 86400000;

        // 如果是昨天签到的，连续签到天数 +1，否则重置连续签到天数
        let checkedDays = user.checkedDays;
        if (isYesterday) {
            checkedDays++;
        } else {
            checkedDays = 1;
        }

        // 根据连续签到天数计算奖励金币数
        let coinReward = 0;
        if (checkedDays === 1) {
            coinReward = 10;
        } else if (checkedDays === 2) {
            coinReward = 15;
        } else if (checkedDays === 3) {
            coinReward = 30;
        } else if (checkedDays === 4) {
            coinReward = 50;
        } else if (checkedDays === 5) {
            coinReward = 70;
        } else if (checkedDays === 6) {
            coinReward = 100;
        } else if (checkedDays === 7) {
            coinReward = 200;
            checkedDays = 0; // 连续签到七天，重置连续签到天数
        }

        // 更新用户签到信息
        user.checkedDays = checkedDays;
        user.lastCheckDate = today;
        user.coinBalance += coinReward;
        await user.save();

        res.status(200).json({
            checkedDays: checkedDays
        });
    } catch (error) {
        next(error);
    }
};

const updateUserProfile = async (req, res, next) => {
    const { avatar, username, city } = req.body;
    const userId = req.user.userId; // 从请求中获取用户 ID

    // 查找用户
    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        return next(err);
    }

    // 如果找不到用户，返回 404 错误
    if (!user) {
        return res.status(404).json({ message: '用户不存在' });
    }

    // 更新用户资料
    if (avatar) {
        user.avatar = avatar;
    }
    if (username) {
        user.username = username;
    }
    if (city) {
        user.city = city;
    }

    // 保存用户资料
    try {
        await user.save();
        res.json({ message: '用户资料修改成功' });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    register,
    uploadAvatar,
    followUser,
    getFollowingUsers,
    getFollowers,
    getFriends,
    performCheckin,
    updateUserProfile,
}
