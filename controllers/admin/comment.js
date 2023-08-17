const Comment = require("../../models/Comment");

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

    await Comment.deleteMany({ _id: { $in: ids } });

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

module.exports = {
  createComment,
  deleteComments,
  getCommentList,
  updateComment,
};
