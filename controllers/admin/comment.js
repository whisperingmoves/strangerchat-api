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

module.exports = {
  createComment,
  deleteComments,
};
