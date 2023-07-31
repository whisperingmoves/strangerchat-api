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
    const { content, city, location, images, visibility, atUsers } = req.body;

    // 校验参数
    if (!content) {
        return res.status(400).json({ message: '请填写帖子内容' });
    }

    // 生成帖子对象
    const post = new Post({
        content,
        city,
        author: req.user.userId, // 使用当前登录用户的ID作为帖子的作者ID
        location,
        images,
        visibility,
        atUsers
    });

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
