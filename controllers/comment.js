const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const InteractionNotification = require("../models/InteractionNotification");
const pushUnreadNotificationsCount = require("../sockets/pushUnreadNotificationsCount");

const createComment = async (req, res, next) => {
  const { content, parentId } = req.body;
  const { postId } = req.params;

  // 校验参数
  if (!content) {
    return res.status(400).json({ message: "请填写评论内容" });
  }

  try {
    // 查询帖子对象
    const post = await Post.findById(postId).populate("author");
    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 创建评论对象
    const comment = new Comment({
      content,
      post: postId,
      author: req.user.userId, // 使用当前登录用户的ID作为评论的作者ID
      parentId: parentId ? parentId : undefined,
    });

    await comment.save();

    // 创建交互类通知
    let notification = null;
    if (parentId) {
      const parentComment = await Comment.findById(parentId).populate("author");
      if (parentComment) {
        if (parentComment.author._id.toString() !== req.user.userId) {
          notification = new InteractionNotification({
            toUser: parentComment.author._id,
            user: req.user.userId,
            interactionType: 5, // 回复评论的交互类型为5
            post: postId,
            comment: comment._id,
          });
          await notification.save();

          await pushUnreadNotificationsCount(
            req.app.get("io"),
            req.app.get("userIdSocketMap"),
            parentComment.author._id.toString()
          );
        }
      }
    } else {
      if (post.author._id.toString() !== req.user.userId) {
        notification = new InteractionNotification({
          toUser: post.author._id,
          user: req.user.userId,
          interactionType: 1, // 评论帖子的交互类型为1
          post: postId,
          comment: comment._id,
        });
        await notification.save();

        await pushUnreadNotificationsCount(
          req.app.get("io"),
          req.app.get("userIdSocketMap"),
          post.author._id.toString()
        );
      }
    }

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
      return res.status(404).json({ message: "评论不存在" });
    }

    // 查找评论并验证作者
    const comment = await Comment.findOne({ _id: commentId, author: userId });

    if (!comment) {
      return res
        .status(404)
        .json({ message: "评论不存在或您无权限删除该评论" });
    }

    // 删除评论
    await comment.delete();

    // 删除相关的交互类通知
    await InteractionNotification.deleteMany({ comment: commentId });

    // 重新推送未读通知数
    const parentComment = comment.parentId
      ? await Comment.findById(comment.parentId).populate("author")
      : null;

    if (parentComment) {
      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        parentComment.author._id.toString()
      );
    } else {
      const post = await Post.findById(comment.post).populate("author");
      if (post) {
        await pushUnreadNotificationsCount(
          req.app.get("io"),
          req.app.get("userIdSocketMap"),
          post.author._id.toString()
        );
      }
    }

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
      return res.status(400).json({ message: "Invalid commentId" });
    }

    // 查找评论
    const comment = await Comment.findById(commentId).populate("author");

    if (!comment) {
      return res.status(404).json({ message: "评论不存在" });
    }

    // 点赞操作
    if (operation === 1) {
      // 检查用户是否已经点过赞
      if (comment.likes.includes(userId)) {
        return res.status(400).json({ message: "您已经点过赞了" });
      }

      comment.likes.push(userId);

      // 创建交互类通知 (评论点赞)，但避免给自己创建通知
      if (comment.author._id.toString() !== userId) {
        const notification = new InteractionNotification({
          toUser: comment.author._id,
          user: userId,
          interactionType: 4, // 交互类型: 评论点赞
          post: comment.post,
          comment: commentId,
        });
        await notification.save();

        await pushUnreadNotificationsCount(
          req.app.get("io"),
          req.app.get("userIdSocketMap"),
          comment.author._id.toString()
        );
      }
    }
    // 取消点赞操作
    else if (operation === 0) {
      // 检查用户是否已经取消点赞
      if (!comment.likes.includes(userId)) {
        return res.status(400).json({ message: "您还没有点赞" });
      }

      comment.likes = comment.likes.filter(
        (like) => like.toString() !== userId
      );

      // 查找并删除对应的交互类通知
      await InteractionNotification.findOneAndDelete({
        toUser: comment.author._id,
        user: userId,
        interactionType: 4, // 交互类型: 评论点赞
        post: comment.post,
        comment: commentId,
      });

      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        comment.author._id.toString()
      );
    }
    // 无效的操作类型
    else {
      return res.status(400).json({ message: "无效的操作类型" });
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
      return res.status(404).json({ message: "评论不存在" });
    }

    const comment = await Comment.findById(commentId).exec();

    if (!comment) {
      return res.status(404).json({ message: "评论不存在" });
    }

    const replies = await Comment.find({ parentId: commentId })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("author", "id avatar username")
      .exec();

    const formattedReplies = replies.map((reply) => ({
      userId: reply.author.id,
      avatar: reply.author.avatar,
      username: reply.author.username,
      createTime: Math.floor(reply.createdAt.getTime() / 1000),
      content: reply.content,
      commentId: reply.id,
      isLiked: reply.likes.includes(req.user.userId) ? 1 : 0,
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
      return res.status(404).json({ message: "帖子不存在" });
    }

    const post = await Post.findById(postId).exec();

    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    const comments = await Comment.find({ post: postId })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("author", "id avatar username")
      .populate({
        path: "parentId",
        populate: { path: "author", select: "id username" },
      })
      .exec();

    const formattedComments = comments.map((comment) => {
      const formattedComment = {
        userId: comment.author.id,
        avatar: comment.author.avatar,
        username: comment.author.username,
        createTime: Math.floor(comment.createdAt.getTime() / 1000),
        content: comment.content,
        commentId: comment.id,
        isLiked: comment.likes.includes(req.user.userId) ? 1 : 0,
      };

      if (comment.parentId) {
        formattedComment.replyUserId = comment.parentId.author.id;
        formattedComment.replyUsername = comment.parentId.author.username;
      }

      return formattedComment;
    });

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
};
