const mongoose = require('mongoose');
const Post = require('../models/Post')
const Comment = require('../models/Comment');
const User = require('../models/User');

const uploadPost = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '请选择文件上传' });
        }

        const image = req.file;
        const fileName = image.filename;

        // 保存图片到本地或者其他处理逻辑
        // const targetPath = path.join(config.imageUploadPath, fileName);
        // image.mv(targetPath);

        const url = '/uploads/posts/' + fileName;

        res.json({ url });

    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const createPost = async (req, res, next) => {
    const { content, city, longitude, latitude, images, visibility, atUsers } = req.body;

    // 校验参数
    if (!content) {
        return res.status(400).json({ message: '请填写帖子内容' });
    }

    // 生成帖子对象
    const post = new Post({
        content,
        author: req.user.userId, // 使用当前登录用户的ID作为帖子的作者ID
    });

    // 添加非必填字段
    if (city) {
        post.city = city;
    }

    // 添加可选的地理位置信息
    if (longitude && latitude) {
        post.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
        };
    }

    // 添加可选的帖子照片列表
    if (images && images.length > 0) {
        post.images = images;
    }

    // 添加可选的帖子可见性
    if (visibility !== undefined) {
        post.visibility = visibility;
    }

    // 添加可选的艾特用户列表
    if (atUsers && atUsers.length > 0) {
        post.atUsers = atUsers;
    }

    try {
        await post.save();

        res.json({ postId: post.id });
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const heatPost = async (req, res, next) => {
    const { postId } = req.params;
    const { action } = req.query;

    try {
        // 检查帖子是否存在
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        // 更新加热次数
        if (action === '1') {
            post.heatCount += 1;
        } else if (action === '0') {
            if (post.heatCount > 0) {
                post.heatCount -= 1;
            } else {
                return res.status(400).json({ message: '帖子未被加热，无法取消加热' });
            }
        } else {
            return res.status(400).json({ message: '无效的加热操作' });
        }

        await post.save();

        res.json({});
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const likePost = async (req, res, next) => {
    const { postId } = req.params;
    const { action } = req.query;

    try {
        // 检查帖子是否存在
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
        const userId = req.user.userId;

        // 检查用户是否已经点赞过该帖子
        const isLiked = post.likes.includes(userId);

        // 根据操作进行点赞或取消点赞
        if (action === '1') {
            if (isLiked) {
                return res.status(400).json({ message: '帖子已经被点赞过' });
            }
            post.likes.push(userId);
        } else if (action === '0') {
            if (!isLiked) {
                return res.status(400).json({ message: '帖子未被点赞，无法取消点赞' });
            }
            post.likes.pull(userId);
        } else {
            return res.status(400).json({ message: '无效的点赞操作' });
        }

        await post.save();

        res.json({});
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const collectPost = async (req, res, next) => {
    const { postId } = req.params;
    const { operation } = req.body;

    try {
        // 检查帖子是否存在
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
        const userId = req.user.userId;

        // 检查用户是否已经收藏过该帖子
        const isCollected = post.collects.includes(userId);

        // 根据操作进行收藏或取消收藏
        if (operation === 1) {
            if (isCollected) {
                return res.status(400).json({ message: '帖子已经被收藏过' });
            }
            post.collects.push(userId);
        } else if (operation === 0) {
            if (!isCollected) {
                return res.status(400).json({ message: '帖子未被收藏，无法取消收藏' });
            }
            post.collects.pull(userId);
        } else {
            return res.status(400).json({ message: '无效的收藏操作' });
        }

        await post.save();

        res.json({});
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const sharePost = async (req, res, next) => {
    const { postId } = req.params;
    const { sharePlatform } = req.body;

    try {
        // 检查帖子是否存在
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
        // const userId = req.user.userId;

        // 检查分享平台的有效性
        if (![1, 2, 3].includes(sharePlatform)) {
            return res.status(400).json({ message: '无效的分享平台' });
        }

        // 创建分享记录
        const shareRecord = {
            sharePlatform,
            sharedAt: new Date()
        };

        // 将分享记录添加到帖子的shares数组中
        post.shares.push(shareRecord);

        // 保存帖子
        await post.save();

        res.json({});
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const getPostDetails = async (req, res, next) => {
    const { postId } = req.params;

    try {
        // 验证 postId 是否是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        const post = await Post.findById(postId)
            .populate('author', 'id avatar username')
            .populate('likes', 'id')
            .populate('collects', 'id')
            .exec();

        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        const isLiked = post.likes.some(like => like.userId.toString() === req.user.userId);
        const isCollected = post.collects.some(collect => collect.userId.toString() === req.user.userId);

        const commentCount = await Comment.countDocuments({ post: postId });

        // 将帖子的浏览次数加1
        post.viewsCount += 1;
        await post.save();

        const postDetails = {
            authorId: post.author.id,
            authorAvatar: post.author.avatar,
            authorName: post.author.username,
            createTime: Math.floor(post.createdAt.getTime() / 1000),
            isFollowed: 0, // 填充当前登录用户是否已关注作者的逻辑
            images: post.images,
            content: post.content,
            city: post.city,
            likeCount: post.likes.length,
            commentCount: commentCount,
            shareCount: post.shares.length,
            postId: post.id,
            isLiked: isLiked ? 1 : 0,
            isCollected: isCollected ? 1 : 0
        };

        res.status(200).json(postDetails);
    } catch (err) {
        next(err);
    }
};

const getHotPosts = async (req, res, next) => {
    try {
        const hotPosts = await Post.aggregate([
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments',
                },
            },
            {
                $addFields: {
                    commentCount: { $size: '$comments' },
                    hotIndex: {
                        $sum: [
                            '$heatCount',
                            '$viewsCount',
                            { $size: '$likes' },
                            { $size: '$collects' },
                            { $size: '$shares' },
                            { $size: '$comments' },
                        ],
                    },
                },
            },
            { $sort: { hotIndex: -1 } },
            { $limit: 7 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $project: {
                    postId: '$_id',
                    userId: '$author',
                    content: { $substr: ['$content', 0, 100] },
                    hotIndex: 1,
                    username: { $arrayElemAt: ['$user.username', 0] },
                },
            },
        ]);

        const formattedPosts = hotPosts.map((post) => ({
            postId: post.postId.toString(),
            userId: post.userId.toString(),
            content: post.content + '...',
            hotIndex: post.hotIndex,
            username: post.username,
        }));

        res.status(200).json(formattedPosts);
    } catch (err) {
        next(err);
    }
};

const getLatestPosts = async (req, res, next) => {
    const { keyword, page = 1, pageSize = 10 } = req.query;

    try {
        const query = {};

        if (keyword) {
            query.content = { $regex: keyword, $options: 'i' };
        }

        const posts = await Post.find(query)
            .sort('-createdAt')
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('author', 'id avatar username')
            .exec();

        const formattedPosts = await Promise.all(
            posts.map(async (post) => {
                const commentCount = await Comment.countDocuments({ post: post.id }).exec();

                return {
                    authorId: post.author.id,
                    authorAvatar: post.author.avatar,
                    authorName: post.author.username,
                    createTime: Math.floor(post.createdAt.getTime() / 1000),
                    images: post.images,
                    content: post.content,
                    city: post.city,
                    likeCount: post.likes.length,
                    commentCount: commentCount,
                    postId: post.id,
                    isLiked: post.likes.includes(req.user.userId) ? 1 : 0,
                    isFollowed: 0,
                };
            })
        );

        res.status(200).json(formattedPosts);
    } catch (err) {
        next(err);
    }
};

const getRecommendedPosts = async (req, res, next) => {
    let { page = "1", pageSize = "10", longitude, latitude } = req.query;
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);
    const query = {};

    if (longitude && latitude) {
        query.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                },
            },
        };
    } else {
        const userId = req.user.userId;
        try {
            const user = await User.findById(userId);
            if (user && user.location && user.location.coordinates && user.location.coordinates.length === 2) {
                query.location = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: user.location.coordinates,
                        },
                    },
                };
            }
        } catch (err) {
            return next(err);
        }
    }

    try {
        let posts;

        if (Object.keys(query).length === 0) {
            // No location query, return all posts
            posts = await Post.find()
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .select('-createdAt -location -__v')
                .populate('author', 'id username avatar');
        } else {
            // Location query present, apply distance sorting
            posts = await Post.find(query)
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .select('-createdAt -location -__v')
                .populate('author', 'id username avatar');
        }

        const userId = req.user.userId;
        const postIds = posts.map(post => post._id);

        const comments = await Comment.aggregate([
            { $match: { post: { $in: postIds } } },
            {
                $group: {
                    _id: '$post',
                    count: { $sum: 1 },
                },
            },
        ]);

        const commentCounts = {};
        comments.forEach(comment => {
            commentCounts[comment._id.toString()] = comment.count;
        });

        const recommendedPosts = posts.map(post => {
            return {
                authorId: post.author.id,
                authorAvatar: post.author.avatar,
                authorName: post.author.username,
                images: post.images,
                content: post.content,
                city: post.city,
                likeCount: post.likes.length,
                commentCount: commentCounts[post._id.toString()] || 0,
                postId: post.id,
                isLiked: post.likes.includes(userId) ? 1 : 0,
                isFollowed: 0, // 暂时写死为0
            };
        });

        res.status(200).json(recommendedPosts);
    } catch (err) {
        next(err);
    }
};

const getFollowedUsersPosts = async (req, res, next) => {
    let { page = "1", pageSize = "10" } = req.query;
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    try {
        const followedUserIds = [];

        const posts = await Post.find({ author: { $in: followedUserIds } })
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('author', 'id avatar username')
            .lean();

        const postIds = posts.map((post) => post._id);

        const commentCounts = await Comment.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: '$post', count: { $sum: 1 } } },
        ]);

        const commentCountsMap = new Map();
        commentCounts.forEach((count) => {
            commentCountsMap.set(count._id.toString(), count.count);
        });

        const formattedPosts = posts.map((post) => {
            const postId = post._id.toString();
            const commentCount = commentCountsMap.has(postId) ? commentCountsMap.get(postId) : 0;

            return {
                authorId: post.author.id,
                authorAvatar: post.author.avatar,
                authorName: post.author.username,
                createTime: Math.floor(post.createdAt.getTime() / 1000),
                images: post.images,
                content: post.content,
                city: post.city,
                likeCount: post.likes.length,
                commentCount: commentCount,
                postId: postId,
                isLiked: post.likes.includes(req.user.userId) ? 1 : 0,
            };
        });

        res.status(200).json(formattedPosts);
    } catch (err) {
        next(err);
    }
};

const getMyPosts = async (req, res, next) => {
    let { page = '1', pageSize = '10' } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);
    const userId = req.user.userId;

    try {
        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .exec();

        const formattedPosts = posts.map((post) => {
            return {
                postId: post.id,
                createTime: Math.floor(post.createdAt.getTime() / 1000),
                content: post.content,
                images: post.images,
                city: post.city
            };
        });

        res.status(200).json(formattedPosts);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    uploadPost,
    createPost,
    heatPost,
    likePost,
    collectPost,
    sharePost,
    getPostDetails,
    getHotPosts,
    getLatestPosts,
    getRecommendedPosts,
    getFollowedUsersPosts,
    getMyPosts,
}
