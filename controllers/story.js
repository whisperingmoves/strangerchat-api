const Post = require("../models/Post");
const User = require("../models/User");
const mongoose = require("mongoose");

const getStoryList = async (req, res, next) => {
  let { page = "1", pageSize = "10" } = req.query;
  page = parseInt(page, 10);
  pageSize = parseInt(pageSize, 10);

  try {
    const aggregateQuery = [
      {
        $match: {
          images: { $exists: true, $ne: [] },
          author: { $ne: mongoose.Types.ObjectId(req.user.userId) }, // 排除当前登录用户
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          "author._id": 1,
          "author.avatar": 1,
          "author.username": 1,
          "author.createdAt": 1,
          "author.online": 1,
          createdAt: 1,
          images: 1,
        },
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ];

    const posts = await Post.aggregate(aggregateQuery).exec();

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const {
          _id,
          avatar,
          username,
          createdAt: userCreatedAt,
          online,
        } = post.author;
        const { createdAt, images } = post;
        const userId = _id.toHexString();
        const currentUser = req.user
          ? await User.findById(req.user.userId)
          : undefined;

        let relation;

        if (!currentUser || currentUser._id.equals(_id)) {
          relation = undefined;
        } else {
          const userCreatedAtTimestamp = userCreatedAt.getTime();
          const nowTimestamp = Date.now();
          const diffDays = Math.round(
            (nowTimestamp - userCreatedAtTimestamp) / (1000 * 60 * 60 * 24)
          );

          if (diffDays <= 7) {
            relation = 3;
          } else {
            const author = await User.findById(_id);
            const isFollowing = currentUser.following.includes(_id);

            if (isFollowing && author.following.includes(currentUser._id)) {
              relation = 0;
            } else if (
              !isFollowing &&
              author.following.includes(currentUser._id)
            ) {
              relation = 1;
            } else if (
              isFollowing &&
              !author.following.includes(currentUser._id)
            ) {
              relation = 2;
            }
          }
        }

        return {
          userId,
          avatar,
          username,
          createTime: Math.floor(createdAt.getTime() / 1000),
          firstImage: images[0],
          online,
          relation,
        };
      })
    );

    res.status(200).json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStoryList,
};
