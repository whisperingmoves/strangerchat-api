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

const getPostList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      author,
      keyword,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (author) filter["author"] = author;
    if (keyword) filter["content"] = { $regex: keyword, $options: "i" };

    const [total, posts] = await Promise.all([
      Post.countDocuments(filter),
      Post.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("author", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post._id,
      content: post.content,
      city: post.city,
      author: {
        id: post.author._id,
        username: post.author.username,
      },
      location:
        post.location && post.location.coordinates ? post.location : undefined,
      images: post.images.length ? post.images : undefined,
      visibility: post.visibility,
      atUsers: post.atUsers.length ? post.atUsers : undefined,
      heatCount: post.heatCount,
      viewsCount: post.viewsCount,
      likes: post.likes.length ? post.likes : undefined,
      collects: post.collects.length ? post.collects : undefined,
      shares: post.shares.length ? post.shares : undefined,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedPosts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  deletePosts,
  getPostList,
};
