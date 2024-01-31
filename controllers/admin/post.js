// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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

const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const {
      content,
      author,
      city,
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

    const post = await Post.findByIdAndUpdate(
      postId,
      {
        content,
        author,
        city,
        location,
        images,
        visibility,
        atUsers,
        heatCount,
        viewsCount,
        likes,
        collects,
        shares,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  deletePosts,
  getPostList,
  updatePost,
};
