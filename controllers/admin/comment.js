const Comment = require("../../models/Comment");
const InteractionNotification = require("../../models/InteractionNotification");

const createComment = async (req, res, next) => {
  try {
    const { content, post, author, parentId, likes } = req.body;

    const comment = await Comment.create({
      content,
      post,
      author,
      parentId,
      likes,
    });

    res.status(201).json({ id: comment.id });
  } catch (error) {
    next(error);
  }
};

const deleteComments = async (req, res, next) => {
  try {
    const { ids } = req.query;

    // 删除评论和关联的子评论
    await cascadeDeleteComments(ids);

    // 删除关联交互类通知
    await InteractionNotification.deleteMany({ comment: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getCommentList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      postId,
      author,
      parentId,
      keyword,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (postId) filter["post"] = postId;
    if (author) filter["author"] = author;
    if (parentId) filter["parentId"] = parentId;
    if (keyword) filter["content"] = { $regex: keyword, $options: "i" };

    const [total, comments] = await Promise.all([
      Comment.countDocuments(filter),
      Comment.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("author", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedComments = comments.map((comment) => ({
      id: comment._id,
      content: comment.content,
      post: comment.post,
      author: {
        id: comment.author._id,
        username: comment.author.username,
      },
      parentId: comment.parentId,
      likes: comment.likes.length ? comment.likes : undefined,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedComments,
    });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content, post, author, parentId, likes } = req.body;

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        content,
        post,
        author,
        parentId,
        likes,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "评论不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

// 级联删除评论及其子评论
async function cascadeDeleteComments(commentIds) {
  // 删除评论和关联的子评论
  async function deleteComment(commentId) {
    // 查找当前评论的子评论
    const childComments = await Comment.find({ parentId: commentId });

    // 递归删除子评论
    for (const childComment of childComments) {
      await deleteComment(childComment._id);
    }

    // 删除当前评论
    await Comment.deleteOne({ _id: commentId });
  }

  // 逐个删除评论及其子评论
  for (const commentId of commentIds) {
    await deleteComment(commentId);
  }
}

module.exports = {
  createComment,
  deleteComments,
  getCommentList,
  updateComment,
};
