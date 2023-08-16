const Post = require("../../models/Post");

const createPost = async (req, res, next) => {
  try {
    const {
      content,
      city,
      author,
      location,
      images,
      visibility,
      atUsers,
      heatCount,
      viewsCount,
      likes,
      collects,
      shares,
    } = req.body;

    const post = await Post.create({
      content,
      city,
      author,
      location,
      images,
      visibility,
      atUsers,
      heatCount,
      viewsCount,
      likes,
      collects,
      shares,
    });

    res.status(201).json({ id: post.id });
  } catch (error) {
    next(error);
  }
};

const deletePosts = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await Post.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  deletePosts,
};
