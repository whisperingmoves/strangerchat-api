const mongoose = require("mongoose");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const InteractionNotification = require("../models/InteractionNotification");
const ChatConversation = require("../models/ChatConversation");
const pushNearestUsers = require("../sockets/pushNearestUsers");
const pushUnreadNotificationsCount = require("../sockets/pushUnreadNotificationsCount");
const { processUsersWithLocation } = require("./helper");
const ErrorMonitorService = require("../services/ErrorMonitorService");

const errorMonitoringService = ErrorMonitorService.getInstance();

const uploadPost = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "请选择文件上传" });
    }

    res.json({ url: req.file.path });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const createPost = async (req, res, next) => {
  const { content, city, longitude, latitude, images, visibility, atUsers } =
    req.body;

  // 校验参数
  if (!content) {
    return res.status(400).json({ message: "请填写帖子内容" });
  }

  // 生成帖子对象
  const post = new Post({
    content,
    author: req.user.userId, // 使用当前登录用户的ID作为帖子的作者ID
  });

  // 添加非必填字段
  if (city) {
    post.city = city;
  }

  // 添加可选的地理位置信息
  if (longitude && latitude) {
    post.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
    // 更新帖子作者的经度和纬度
    const author = await User.findById(req.user.userId);
    author.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
    await author.save();
  }

  // 添加可选的帖子照片列表
  if (images && images.length > 0) {
    post.images = images;
  }

  // 添加可选的帖子可见性
  if (visibility !== undefined) {
    post.visibility = visibility;
  }

  // 添加可选的艾特用户列表
  if (atUsers && atUsers.length > 0) {
    post.atUsers = atUsers;

    for (const atUser of atUsers) {
      await InteractionNotification.create({
        toUser: atUser,
        user: req.user.userId,
        interactionType: 6, // 帖子艾特用户
        post: post._id,
      });

      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        atUser
      );
    }
  }

  try {
    await post.save();

    res.json({ postId: post._id });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const heatPost = async (req, res, next) => {
  const { postId } = req.params;
  const { action } = req.query;

  try {
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 检查用户是否存在
    const userId = req.user.userId; // 假设通过验证的用户存储在req.user.userId中
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 检查免费加热次数
    if (action === "1") {
      if (user.freeHeatsLeft === 0) {
        return res.status(400).json({ message: "没有免费加热次数了" });
      }
      user.freeHeatsLeft -= 1;
    } else if (action === "0") {
      if (post.heatCount === 0) {
        return res.status(400).json({ message: "帖子未被加热，无法取消加热" });
      }
      user.freeHeatsLeft += 1;
    } else {
      return res.status(400).json({ message: "无效的加热操作" });
    }

    // 更新加热次数
    if (action === "1") {
      post.heatCount += 1;
    } else if (action === "0") {
      post.heatCount -= 1;
    }

    await Promise.all([user.save(), post.save()]);

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const likePost = async (req, res, next) => {
  const { postId } = req.params;
  const { action } = req.query;

  try {
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
    const userId = req.user.userId;

    // 检查用户是否已经点赞过该帖子
    const isLiked = post.likes.includes(userId);

    // 根据操作进行点赞或取消点赞
    if (action === "1") {
      if (isLiked) {
        return res.status(400).json({ message: "帖子已经被点赞过" });
      }
      post.likes.push(userId);

      // 创建交互类通知
      if (post.author.toString() !== userId) {
        // 避免给自己发通知
        const notification = new InteractionNotification({
          toUser: post.author,
          user: userId,
          interactionType: 0, // 给帖子点赞
          post: postId,
        });
        await notification.save();

        await pushUnreadNotificationsCount(
          req.app.get("io"),
          req.app.get("userIdSocketMap"),
          post.author.toString()
        );
      }
    } else if (action === "0") {
      if (!isLiked) {
        return res.status(400).json({ message: "帖子未被点赞，无法取消点赞" });
      }
      post.likes.pull(userId);

      // 删除交互类通知
      await InteractionNotification.deleteOne({
        toUser: post.author,
        user: userId,
        interactionType: 0,
        post: postId,
      });

      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        post.author.toString()
      );
    } else {
      return res.status(400).json({ message: "无效的点赞操作" });
    }

    await post.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const collectPost = async (req, res, next) => {
  const { postId } = req.params;
  const { operation } = req.body;

  try {
    // 检查帖子是否存在
    const post = await Post.findById(postId).populate("author");
    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
    const userId = req.user.userId;

    // 检查用户是否已经收藏过该帖子
    const isCollected = post.collects.includes(userId);

    // 根据操作进行收藏或取消收藏
    if (operation === 1) {
      if (isCollected) {
        return res.status(400).json({ message: "帖子已经被收藏过" });
      }
      post.collects.push(userId);

      // 创建交互类通知 (收藏帖子)
      const notification = new InteractionNotification({
        toUser: post.author._id,
        user: userId,
        interactionType: 3, // 交互类型: 收藏帖子
        post: postId,
      });
      await notification.save();

      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        post.author._id.toString()
      );
    } else if (operation === 0) {
      if (!isCollected) {
        return res.status(400).json({ message: "帖子未被收藏，无法取消收藏" });
      }
      post.collects.pull(userId);

      // 删除交互类通知 (收藏帖子)
      await InteractionNotification.deleteOne({
        toUser: post.author._id,
        user: userId,
        interactionType: 3, // 交互类型: 收藏帖子
        post: postId,
      });

      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        post.author._id.toString()
      );
    } else {
      return res.status(400).json({ message: "无效的收藏操作" });
    }

    await post.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const sharePost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    // 检查帖子是否存在
    const post = await Post.findById(postId).populate("author");
    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
    const userId = req.user.userId;

    // 创建分享记录
    const shareRecord = {
      sharedAt: new Date(),
    };

    // 将分享记录添加到帖子的shares数组中
    post.shares.push(shareRecord);

    // 创建交互类通知 (分享帖子)
    const notification = new InteractionNotification({
      toUser: post.author._id,
      user: userId,
      interactionType: 2, // 交互类型: 分享帖子
      post: postId,
    });
    await notification.save();

    await pushUnreadNotificationsCount(
      req.app.get("io"),
      req.app.get("userIdSocketMap"),
      post.author._id.toString()
    );

    // 保存帖子
    await post.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const getPostDetails = async (req, res, next) => {
  const { postId } = req.params;

  try {
    // 验证 postId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    const post = await Post.findById(postId)
      .populate("author", "id avatar gender username")
      .populate("likes", "id")
      .populate("collects", "id")
      .populate("atUsers", "id username")
      .exec();

    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    const isLiked = post.likes.some(
      (like) => like.id.toString() === req.user.userId
    );
    const isCollected = post.collects.some(
      (collect) => collect.id.toString() === req.user.userId
    );
    const isFollowed = await User.findOne({
      _id: req.user.userId,
      following: post.author._id,
    })
      .countDocuments()
      .exec();

    const isBlocked = await User.findOne({
      _id: req.user.userId,
      blockedUsers: post.author._id,
    })
      .countDocuments()
      .exec();

    const commentCount = await Comment.countDocuments({ post: postId });

    // 将帖子的浏览次数加1
    post.viewsCount += 1;
    await post.save();

    // 查询当前用户和帖子作者之间的聊天会话
    const conversation = await ChatConversation.findOne({
      $or: [
        { userId1: req.user.userId, userId2: post.author._id },
        { userId1: post.author._id, userId2: req.user.userId },
      ],
    });

    const conversationId = conversation ? conversation._id : undefined;

    const postDetails = {
      authorId: post.author._id,
      authorAvatar: post.author.avatar,
      authorGender: post.author.gender,
      authorName: post.author.username,
      createTime: Math.floor(post.createdAt.getTime() / 1000),
      isFollowed: isFollowed ? 1 : 0,
      isBlocked: isBlocked ? 1 : 0,
      images: post.images,
      content: post.content,
      city: post.city,
      likeCount: post.likes.length,
      commentCount: commentCount,
      shareCount: post.shares.length,
      postId: post._id,
      isLiked: isLiked ? 1 : 0,
      isCollected: isCollected ? 1 : 0,
      conversationId,
      atUsers:
        post.atUsers && post.atUsers.length > 0
          ? post.atUsers.map((user) => ({
              id: user._id,
              username: user.username,
            }))
          : undefined,
    };

    res.status(200).json(postDetails);
  } catch (err) {
    next(err);
  }
};

const getHotPosts = async (req, res, next) => {
  try {
    const hotPosts = await Post.aggregate([
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" },
          hotIndex: {
            $sum: [
              "$heatCount",
              "$viewsCount",
              { $size: "$likes" },
              { $size: "$collects" },
              { $size: "$shares" },
              { $size: "$comments" },
            ],
          },
        },
      },
      { $sort: { hotIndex: -1 } },
      { $limit: 7 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $match: {
          visibility: 0, // 添加 visibility 值为 0 的筛选条件
        },
      },
      {
        $project: {
          postId: "$_id",
          userId: "$author",
          content: { $substr: ["$content", 0, 100] },
          hotIndex: 1,
          username: { $arrayElemAt: ["$user.username", 0] },
        },
      },
    ]);

    const formattedPosts = hotPosts.map((post) => ({
      postId: post.postId.toString(),
      userId: post.userId.toString(),
      content: post.content + "...",
      hotIndex: post.hotIndex,
      username: post.username,
    }));

    res.status(200).json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

const getLatestPosts = async (req, res, next) => {
  let { keyword, page = "1", pageSize = "10", filter = "0" } = req.query;
  page = parseInt(page);
  pageSize = parseInt(pageSize);
  filter = parseInt(filter);

  try {
    const query = {
      visibility: 0, // 添加 visibility 值为 0 的筛选条件
    };

    if (keyword) {
      query.content = { $regex: keyword, $options: "i" };
    }

    if (filter === 1) {
      query.likes = req.user.userId;
    } else if (filter === 2) {
      const commentedPostIds = await Comment.distinct("post", {
        author: req.user.userId,
      }).exec();
      query._id = { $in: commentedPostIds };
    } else if (filter === 3) {
      const favoritedPostIds = await Post.distinct("_id", {
        collects: req.user.userId,
      }).exec();
      query._id = { $in: favoritedPostIds };
    }

    const posts = await Post.find(query)
      .sort("-createdAt")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("author", "id avatar username")
      .populate("atUsers", "id username")
      .exec();

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({
          post: post._id,
        }).exec();
        const isFollowed = await User.findOne({
          _id: req.user.userId,
          following: post.author._id,
        })
          .countDocuments()
          .exec();
        const isBlocked = await User.findOne({
          _id: req.user.userId,
          blockedUsers: post.author._id,
        })
          .countDocuments()
          .exec();

        const conversation = await ChatConversation.findOne({
          $or: [
            { userId1: req.user.userId, userId2: post.author._id },
            { userId1: post.author._id, userId2: req.user.userId },
          ],
        });

        const conversationId = conversation ? conversation._id : undefined;

        return {
          authorId: post.author._id,
          authorAvatar: post.author.avatar,
          authorName: post.author.username,
          createTime: Math.floor(post.createdAt.getTime() / 1000),
          images: post.images,
          content: post.content,
          city: post.city,
          likeCount: post.likes.length,
          commentCount: commentCount,
          shareCount: post.shares.length,
          postId: post._id,
          isLiked: post.likes
            .map((item) => item._id.toHexString())
            .includes(req.user.userId)
            ? 1
            : 0,
          isFollowed: isFollowed ? 1 : 0,
          isBlocked: isBlocked ? 1 : 0,
          conversationId,
          atUsers:
            post.atUsers && post.atUsers.length > 0
              ? post.atUsers.map((user) => ({
                  id: user._id,
                  username: user.username,
                }))
              : undefined,
        };
      })
    );

    res.status(200).json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

const getRecommendedPosts = async (req, res, next) => {
  let { page = "1", pageSize = "10", longitude, latitude } = req.query;
  page = parseInt(page, 10);
  pageSize = parseInt(pageSize, 10);
  const query = {
    visibility: 0, // 添加 visibility 值为 0 的筛选条件
  };

  if (longitude && latitude) {
    query["location.coordinates"] = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      },
    };
    // 更新当前用户模型的经度和纬度
    const userId = req.user.userId;
    const user = await User.findById(userId);
    user.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
    await user.save();
    // 更新用户的位置信息后，调用相应的处理函数
    const io = req.app.get("io");
    const userIdSocketMap = req.app.get("userIdSocketMap");
    pushNearestUsers(io, userIdSocketMap, userId).then();
    processUsersWithLocation(io, userIdSocketMap, userId)
      .then()
      .catch((error) => {
        errorMonitoringService.monitorError(error).then();
        console.error("processUsersWithLocation error: ", error);
      });
  } else {
    const userId = req.user.userId;
    try {
      const user = await User.findById(userId);
      if (
        user &&
        user.location &&
        user.location.coordinates &&
        user.location.coordinates.length === 2
      ) {
        query["location.coordinates"] = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: user.location.coordinates,
            },
          },
        };
      }
    } catch (err) {
      return next(err);
    }
  }

  try {
    let posts;

    if (Object.keys(query).length === 0) {
      // No location query, return all posts
      posts = await Post.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("-createdAt -location -__v")
        .populate("atUsers", "id username")
        .populate("author", "id username avatar");
    } else {
      // Location query present, apply distance sorting
      posts = await Post.find(query)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("-createdAt -location -__v")
        .populate("atUsers", "id username")
        .populate("author", "id username avatar");
    }

    const userId = req.user.userId;
    const postIds = posts.map((post) => post._id);

    const comments = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      {
        $group: {
          _id: "$post",
          count: { $sum: 1 },
        },
      },
    ]);

    const commentCounts = {};
    comments.forEach((comment) => {
      commentCounts[comment._id.toString()] = comment.count;
    });

    const followedAuthors = await User.findById(userId, "following").lean();
    const followedAuthorIds = followedAuthors.following.map((item) =>
      item.toHexString()
    );

    const blockedAuthors = await User.findById(userId, "blockedUsers").lean();
    const blockedAuthorIds = blockedAuthors.blockedUsers.map((item) =>
      item.toHexString()
    );

    const recommendedPosts = await Promise.all(
      posts.map(async (post) => {
        const conversation = await ChatConversation.findOne({
          $or: [
            { userId1: req.user.userId, userId2: post.author._id },
            { userId1: post.author._id, userId2: req.user.userId },
          ],
        });

        const conversationId = conversation ? conversation._id : undefined;

        return {
          authorId: post.author._id,
          authorAvatar: post.author.avatar,
          authorName: post.author.username,
          images: post.images,
          content: post.content,
          city: post.city,
          likeCount: post.likes.length,
          commentCount: commentCounts[post._id.toString()] || 0,
          shareCount: post.shares.length,
          postId: post._id,
          isLiked: post.likes
            .map((item) => item._id.toHexString())
            .includes(userId)
            ? 1
            : 0,
          isFollowed: followedAuthorIds.includes(post.author._id.toHexString())
            ? 1
            : 0,
          isBlocked: blockedAuthorIds.includes(post.author._id.toHexString())
            ? 1
            : 0,
          conversationId,
          atUsers:
            post.atUsers && post.atUsers.length > 0
              ? post.atUsers.map((user) => ({
                  id: user._id,
                  username: user.username,
                }))
              : undefined,
        };
      })
    );

    res.status(200).json(recommendedPosts);
  } catch (err) {
    next(err);
  }
};

const getFollowedUsersPosts = async (req, res, next) => {
  let { page = "1", pageSize = "10" } = req.query;
  page = parseInt(page, 10);
  pageSize = parseInt(pageSize, 10);

  try {
    const currentUser = await User.findById(req.user.userId);
    const followedUserIds = currentUser.following;

    const posts = await Post.find({
      author: { $in: followedUserIds },
      visibility: 0, // 添加 visibility 值为 0 的筛选条件
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("author", "avatar username")
      .populate("atUsers", "username")
      .lean();

    const postIds = posts.map((post) => post._id);

    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);

    const commentCountsMap = new Map();
    commentCounts.forEach((count) => {
      commentCountsMap.set(count._id.toString(), count.count);
    });

    const blockedAuthors = await User.findById(
      req.user.userId,
      "blockedUsers"
    ).lean();
    const blockedAuthorIds = blockedAuthors.blockedUsers.map((item) =>
      item.toHexString()
    );

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const postId = post._id.toString();
        const commentCount = commentCountsMap.has(postId)
          ? commentCountsMap.get(postId)
          : 0;

        const conversation = await ChatConversation.findOne({
          $or: [
            { userId1: req.user.userId, userId2: post.author._id },
            { userId1: post.author._id, userId2: req.user.userId },
          ],
        });

        const conversationId = conversation ? conversation._id : undefined;

        return {
          authorId: post.author._id,
          authorAvatar: post.author.avatar,
          authorName: post.author.username,
          createTime: Math.floor(post.createdAt.getTime() / 1000),
          images: post.images,
          content: post.content,
          city: post.city,
          likeCount: post.likes.length,
          commentCount: commentCount,
          shareCount: post.shares.length,
          postId: postId,
          isLiked: post.likes
            .map((item) => item._id.toHexString())
            .includes(req.user.userId)
            ? 1
            : 0,
          conversationId,
          atUsers:
            post.atUsers && post.atUsers.length > 0
              ? post.atUsers.map((user) => ({
                  id: user._id,
                  username: user.username,
                }))
              : undefined,
          isBlocked: blockedAuthorIds.includes(post.author._id.toHexString())
            ? 1
            : 0,
        };
      })
    );

    res.status(200).json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

const getMyPosts = async (req, res, next) => {
  let { page = "1", pageSize = "10" } = req.query;
  page = parseInt(page);
  pageSize = parseInt(pageSize);
  const userId = req.user.userId;

  try {
    const posts = await Post.find({ author: userId })
      .populate("atUsers", "id username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    const formattedPosts = posts.map((post) => {
      return {
        postId: post._id,
        createTime: Math.floor(post.createdAt.getTime() / 1000),
        content: post.content,
        images: post.images,
        city: post.city,
        atUsers:
          post.atUsers && post.atUsers.length > 0
            ? post.atUsers.map((user) => ({
                id: user._id,
                username: user.username,
              }))
            : undefined,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

const getUserPosts = async (req, res, next) => {
  let { page = "1", pageSize = "10" } = req.query;
  page = parseInt(page);
  pageSize = parseInt(pageSize);
  const { userId } = req.params;

  try {
    const posts = await Post.find({ author: userId, visibility: { $ne: 2 } })
      .populate("atUsers", "id username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    const formattedPosts = posts.map((post) => {
      return {
        postId: post._id,
        createTime: Math.floor(post.createdAt.getTime() / 1000),
        content: post.content,
        images: post.images,
        city: post.city,
        atUsers:
          post.atUsers && post.atUsers.length > 0
            ? post.atUsers.map((user) => ({
                id: user._id,
                username: user.username,
              }))
            : undefined,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

const getMyPostDetails = async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.user.userId; // 当前登录用户的ID

  try {
    // 验证 postId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    const post = await Post.findOne({ _id: postId, author: userId })
      .populate("author", "id avatar username")
      .populate("atUsers", "id username")
      .populate("likes", "id")
      .exec();

    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    const isLiked = post.likes.some(
      (like) => like.userId.toString() === userId
    );

    const commentCount = await Comment.countDocuments({ post: postId });

    const postDetails = {
      createTime: Math.floor(post.createdAt.getTime() / 1000),
      images: post.images,
      content: post.content,
      city: post.city,
      likeCount: post.likes.length,
      commentCount: commentCount,
      shareCount: post.shares.length,
      postId: post._id,
      isLiked: isLiked ? 1 : 0,
      atUsers:
        post.atUsers && post.atUsers.length > 0
          ? post.atUsers.map((user) => ({
              id: user._id,
              username: user.username,
            }))
          : undefined,
    };

    res.status(200).json(postDetails);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadPost,
  createPost,
  heatPost,
  likePost,
  collectPost,
  sharePost,
  getPostDetails,
  getHotPosts,
  getLatestPosts,
  getRecommendedPosts,
  getFollowedUsersPosts,
  getMyPosts,
  getUserPosts,
  getMyPostDetails,
};
