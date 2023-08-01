const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

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

const likeComment = async (req, res, next) => {
    const { commentId } = req.params;
    const { operation } = req.body;
    const userId = req.user.userId;

    try {
        // 验证 commentId 是否是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: 'Invalid commentId' });
        }

        // 查找评论
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }

        // 点赞操作
        if (operation === 1) {
            // 检查用户是否已经点过赞
            if (comment.likes.includes(userId)) {
                return res.status(400).json({ message: '您已经点过赞了' });
            }

            comment.likes.push(userId);
        }
        // 取消点赞操作
        else if (operation === 0) {
            // 检查用户是否已经取消点赞
            if (!comment.likes.includes(userId)) {
                return res.status(400).json({ message: '您还没有点赞' });
            }

            comment.likes = comment.likes.filter(like => like.toString() !== userId);
        }
        // 无效的操作类型
        else {
            return res.status(400).json({ message: '无效的操作类型' });
        }

        await comment.save();

        res.sendStatus(200);
    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

const getCommentReplies = async (req, res, next) => {
    const { commentId } = req.params;
    let { page = "1", pageSize = "10" } = req.query;
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    try {
        // 验证 commentId 是否是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(404).json({ message: '评论不存在' });
        }

        const comment = await Comment.findById(commentId).exec();

        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }

        const replies = await Comment.find({ parentId: commentId })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('author', 'id avatar username')
            .exec();

        const formattedReplies = replies.map(reply => ({
            userId: reply.author.id,
            avatar: reply.author.avatar,
            username: reply.author.username,
            createTime: Math.floor(reply.createdAt.getTime() / 1000),
            content: reply.content,
            commentId: reply.id
        }));

        res.status(200).json(formattedReplies);
    } catch (err) {
        next(err);
    }
};

const getPostComments = async (req, res, next) => {
    const { postId } = req.params;
    let { page = "1", pageSize = "10" } = req.query;
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    try {
        // 验证 postId 是否是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        const post = await Post.findById(postId).exec();

        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        const comments = await Comment.find({ post: postId })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('author', 'id avatar username')
            .exec();

        const formattedComments = comments.map(comment => ({
            userId: comment.author.id,
            avatar: comment.author.avatar,
            username: comment.author.username,
            createTime: Math.floor(comment.createdAt.getTime() / 1000),
            content: comment.content,
            commentId: comment.id
        }));

        res.status(200).json(formattedComments);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createComment,
    deleteComment,
    likeComment,
    getCommentReplies,
    getPostComments,
}
