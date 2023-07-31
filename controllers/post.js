const Post = require('../models/Post')

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

module.exports = {
    uploadPost,
    createPost,
    heatPost,
    likePost,
    collectPost,
}
