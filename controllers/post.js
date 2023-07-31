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

module.exports = {
    uploadPost,
    createPost
}
