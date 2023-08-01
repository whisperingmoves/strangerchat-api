const mongoose = require('mongoose');
const Comment = require('../models/Comment');

const createComment = async (req, res, next) => {
    const { content, parentId } = req.body;
    const { postId } = req.params;

    // 校验参数
    if (!content) {
        return res.status(400).json({ message: '请填写评论内容' });
    }

    try {
        // 创建评论对象
        const comment = new Comment({
            content,
            post: postId,
            author: req.user.userId, // 使用当前登录用户的ID作为评论的作者ID
            parentId: parentId ? parentId : undefined
        });

        await comment.save();

        res.status(200).json({ commentId: comment.id }); // 返回新增评论的ID
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const deleteComment = async (req, res, next) => {
    const { commentId } = req.params;
    const userId = req.user.userId;

    try {
        // 验证 commentId 是否是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(404).json({ message: '评论不存在' });
        }

        // 查找评论并验证作者
        const comment = await Comment.findOne({ _id: commentId, author: userId });

        if (!comment) {
            return res.status(404).json({ message: '评论不存在或您无权限删除该评论' });
        }

        await comment.delete();

        res.sendStatus(200);
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

module.exports = {
    createComment,
    deleteComment,
}
