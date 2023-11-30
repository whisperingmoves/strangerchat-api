const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const StatusNotification = require("../models/StatusNotification");
const ChatConversation = require("../models/ChatConversation");
const UserReport = require("../models/UserReport");
const SystemNotification = require("../models/SystemNotification");
const { sign } = require("jsonwebtoken");
const config = require("../config");
const {
  processUsersWithEmptyLocation,
  processAllOnlineUsers,
  processUsersWithLocation,
} = require("./helper");
const pushNearestUsers = require("../sockets/pushNearestUsers");
const pushUnreadNotificationsCount = require("../sockets/pushUnreadNotificationsCount");
const pushCoinBalance = require("../sockets/pushCoinBalance");
const pushFollowersCount = require("../sockets/pushFollowersCount");
const pushVisitorsCount = require("../sockets/pushVisitorsCount");
const ErrorMonitorService = require("../services/ErrorMonitorService");
const { __ } = require("../lang/lang");

const errorMonitoringService = ErrorMonitorService.getInstance();

const register = async (req, res, next) => {
  const { mobile, gender, birthday, avatar, longitude, latitude, language } =
    req.body;

  // 校验参数
  if (!mobile || !gender || !birthday || !avatar) {
    return res.status(400).json({ message: "请填写完整信息" });
  }

  // 生成用户对象
  const user = new User({
    mobile,
    gender,
    birthday,
    avatar,
  });

  // 保存地理位置(可选)
  if (longitude && latitude) {
    user.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
  }

  // 保存语言代码(可选)
  if (language) {
    user.language = language;
  }

  try {
    await user.save();

    // 生成JWT token
    const token = sign({ userId: user.id }, config.jwtSecret);

    // 更新用户的位置信息后，调用相应的处理函数
    const io = req.app.get("io");
    const userIdSocketMap = req.app.get("userIdSocketMap");
    if (!user.location || !user.location.coordinates) {
      processUsersWithEmptyLocation(io, userIdSocketMap, user.id)
        .then()
        .catch((error) => {
          errorMonitoringService.monitorError(error).then();
          console.error("processUsersWithEmptyLocation error: ", error);
        });
    } else {
      processAllOnlineUsers(io, userIdSocketMap, user.id)
        .then()
        .catch((error) => {
          errorMonitoringService.monitorError(error).then();
          console.error("processAllOnlineUsers error: ", error);
        });
    }

    res.json({
      token,
      userId: user.id,
    });
  } catch (err) {
    if (err.message.includes("duplicate key error")) {
      res.status(400).json({ message: "用户已存在" });
    } else {
      next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "请选择文件上传" });
    }

    res.json({ url: req.file.path });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const followUser = async (req, res, next) => {
  const { userId } = req.params;
  const { action } = req.query;

  try {
    // 检查被关注用户是否存在
    const followedUser = await User.findById(userId);
    if (!followedUser) {
      return res.status(404).json({ message: "被关注用户不存在" });
    }

    // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
    const followerId = req.user.userId;

    // 根据操作进行关注或取消关注
    const follower = await User.findById(followerId);
    if (action === "1") {
      // 检查被关注用户是否已被关注
      if (follower.following.includes(userId)) {
        return res.status(400).json({ message: "用户已被关注" });
      }

      await follower.followUser(userId);
      followedUser.followersCount++;

      // 创建状态类通知
      if (followedUser.id !== followerId) {
        // 避免给自己发通知
        const notification = new StatusNotification({
          toUser: followedUser.id,
          user: followerId,
          statusType: 0, // 关注用户
        });
        await notification.save();

        await pushUnreadNotificationsCount(
          req.app.get("io"),
          req.app.get("userIdSocketMap"),
          followedUser.id
        );

        await pushFollowersCount(
          req.app.get("io"),
          req.app.get("userIdSocketMap"),
          followedUser.id,
          followedUser.followersCount
        );
      }
    } else if (action === "0") {
      // 检查被关注用户是否未被关注
      if (!follower.following.includes(userId)) {
        return res.status(400).json({ message: "用户未被关注，无法取消关注" });
      }

      await follower.unfollowUser(userId);
      followedUser.followersCount--;

      // 删除状态类通知
      await StatusNotification.deleteOne({
        toUser: followedUser.id,
        user: followerId,
        statusType: 0,
      });

      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        followedUser.id
      );

      await pushFollowersCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        followedUser.id,
        followedUser.followersCount
      );
    } else {
      return res.status(400).json({ message: "无效的关注操作" });
    }

    await followedUser.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const blockUser = async (req, res, next) => {
  const { userId } = req.params;
  const { action } = req.query;

  try {
    // 检查被拉黑用户是否存在
    const blockedUser = await User.findById(userId);
    if (!blockedUser) {
      return res.status(404).json({ message: "被拉黑用户不存在" });
    }

    // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);

    if (action === "1") {
      // 检查被拉黑用户是否已被拉黑
      if (currentUser.blockedUsers.includes(userId)) {
        return res.status(400).json({ message: "用户已被拉黑" });
      }

      await currentUser.blockUser(userId);
    } else if (action === "0") {
      // 检查被拉黑用户是否未被拉黑
      if (!currentUser.blockedUsers.includes(userId)) {
        return res.status(400).json({ message: "用户未被拉黑，无法取消拉黑" });
      }

      await currentUser.unblockUser(userId);
    } else {
      return res.status(400).json({ message: "无效的拉黑操作" });
    }

    await currentUser.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const reportUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // 检查被举报用户是否存在
    const reportedUser = await User.findById(userId);
    if (!reportedUser) {
      return res.status(404).json({ message: "被举报用户不存在" });
    }

    // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
    const reporterId = req.user.userId;

    // 创建举报记录
    const userReport = new UserReport({
      user: reporterId,
      reportedUser: userId,
    });
    await userReport.save();

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const getFollowingUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword;
    const userId = req.user.userId;

    const currentUser = await User.findById(userId).populate("following");

    let query = User.find(
      { _id: { $in: currentUser.following } },
      { avatar: 1, username: 1 }
    ).sort({ createdAt: -1 });

    if (keyword) {
      query = query.where("username", new RegExp(keyword, "i"));
    }

    const users = await query.skip(skip).limit(pageSize).lean().exec();

    const userIds = users.map((user) => user._id);

    const latestPosts = await Post.aggregate([
      {
        $match: { author: { $in: userIds } },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$author",
          latestPost: { $first: "$content" },
        },
      },
    ]);

    const latestPostsMap = new Map(
      latestPosts.map((post) => [post._id.toString(), post.latestPost])
    );

    // 查询当前用户和关注用户之间的聊天会话
    const conversationMap = new Map();
    const conversations = await ChatConversation.find({
      $or: [
        { userId1: userId, userId2: { $in: userIds } },
        { userId1: { $in: userIds }, userId2: userId },
      ],
    });
    conversations.forEach((conversation) => {
      const otherUserId =
        conversation.userId1.toString() === userId
          ? conversation.userId2.toString()
          : conversation.userId1.toString();
      conversationMap.set(otherUserId, conversation.id);
    });

    const formattedUsers = users.map((user) => {
      const { _id, avatar, username } = user;
      const latestPostContent = latestPostsMap.get(_id.toString());
      const conversationId = conversationMap.get(_id.toString());
      return {
        userId: _id,
        userAvatar: avatar,
        username,
        latestPostContent,
        conversationId: conversationId || undefined,
        isFollowed: 1,
      };
    });

    res.status(200).json(formattedUsers);
  } catch (error) {
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword;
    const userId = req.user.userId;

    const currentUser = await User.findById(userId, "following").lean();

    const followedUserIds = currentUser.following.map((item) =>
      item.toHexString()
    );

    const query = User.find(
      { following: userId },
      { avatar: 1, username: 1 }
    ).sort({ createdAt: -1 });

    if (keyword) {
      query.where("username", new RegExp(keyword, "i"));
    }

    const users = await query.skip(skip).limit(pageSize).lean().exec();

    const userIds = users.map((user) => user._id);

    const latestPosts = await Post.aggregate([
      {
        $match: { author: { $in: userIds } },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$author",
          latestPost: { $first: "$content" },
        },
      },
    ]);

    const latestPostsMap = new Map(
      latestPosts.map((post) => [post._id.toString(), post.latestPost])
    );

    // 查询当前用户和关注我的用户之间的聊天会话
    const conversationMap = new Map();
    const conversations = await ChatConversation.find({
      $or: [
        { userId1: { $in: userIds }, userId2: userId },
        { userId1: userId, userId2: { $in: userIds } },
      ],
    });
    conversations.forEach((conversation) => {
      const otherUserId =
        conversation.userId1.toString() === userId
          ? conversation.userId2.toString()
          : conversation.userId1.toString();
      conversationMap.set(otherUserId, conversation.id);
    });

    const formattedUsers = users.map((user) => {
      const { _id, avatar, username } = user;
      const latestPostContent = latestPostsMap.get(_id.toString());
      const conversationId = conversationMap.get(_id.toString());
      return {
        userId: _id,
        userAvatar: avatar,
        username,
        latestPostContent,
        conversationId: conversationId || undefined,
        isFollowed: followedUserIds.includes(_id.toHexString()) ? 1 : 0,
      };
    });

    res.status(200).json(formattedUsers);
  } catch (error) {
    next(error);
  }
};

const getFriends = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword;
    const userId = req.user.userId;

    const currentUser = await User.findById(userId).populate("following");

    let query = User.find(
      { _id: { $in: currentUser.following }, following: userId },
      { avatar: 1, username: 1 }
    ).sort({ createdAt: -1 });

    if (keyword) {
      query = query.where("username", new RegExp(keyword, "i"));
    }

    const users = await query.skip(skip).limit(pageSize).lean().exec();

    // 获取互相关注的用户的总数
    const totalCount = await query.countDocuments().lean().exec();

    const userIds = users.map((user) => user._id);

    const latestPosts = await Post.aggregate([
      {
        $match: { author: { $in: userIds } },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$author",
          latestPost: { $first: "$content" },
        },
      },
    ]);

    const latestPostsMap = new Map(
      latestPosts.map((post) => [post._id.toString(), post.latestPost])
    );

    // 查询当前用户和互相关注的用户之间的聊天会话
    const conversationMap = new Map();
    const conversations = await ChatConversation.find({
      $or: [
        { userId1: { $in: userIds }, userId2: userId },
        { userId1: userId, userId2: { $in: userIds } },
      ],
    });
    conversations.forEach((conversation) => {
      const otherUserId =
        conversation.userId1.toString() === userId
          ? conversation.userId2.toString()
          : conversation.userId1.toString();
      conversationMap.set(otherUserId, conversation.id);
    });

    const formattedUsers = users.map((user) => {
      const { _id, avatar, username } = user;
      const latestPostContent = latestPostsMap.get(_id.toString());
      const conversationId = conversationMap.get(_id.toString());
      return {
        userId: _id,
        userAvatar: avatar,
        username,
        latestPostContent,
        conversationId: conversationId || undefined,
        isFollowed: 1,
      };
    });

    const result = {
      list: formattedUsers,
      total: totalCount,
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const performCheckin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    // 获取当前日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查上次签到日期是否是昨天
    const lastCheckDate = user.lastCheckDate;
    const isYesterday =
      lastCheckDate && lastCheckDate.getTime() === today.getTime() - 86400000;

    // 如果是昨天签到的，连续签到天数 +1，否则重置连续签到天数
    let checkedDays = user.checkedDays;
    if (isYesterday) {
      checkedDays++;
    } else {
      checkedDays = 1;
    }

    // 根据连续签到天数计算奖励金币数
    let coinReward = 0;
    if (checkedDays === 1) {
      coinReward = 10;
    } else if (checkedDays === 2) {
      coinReward = 15;
    } else if (checkedDays === 3) {
      coinReward = 30;
    } else if (checkedDays === 4) {
      coinReward = 50;
    } else if (checkedDays === 5) {
      coinReward = 70;
    } else if (checkedDays === 6) {
      coinReward = 100;
    } else if (checkedDays === 7) {
      coinReward = 200;
      checkedDays = 0; // 连续签到七天，重置连续签到天数
    }

    // 更新用户签到信息
    user.checkedDays = checkedDays;
    user.lastCheckDate = today;
    user.coinBalance += coinReward;
    await user.save();

    // 创建系统类通知
    const systemNotificationData = {
      toUser: userId,
      notificationType: 1,
      notificationTitle: __("Sign in Successfully", [], user.language),
      notificationContent: __(
        "You have earned %d coins",
        [coinReward],
        user.language
      ),
      readStatus: 0,
    };
    const systemNotification = new SystemNotification(systemNotificationData);
    await systemNotification.save();

    pushUnreadNotificationsCount(
      req.app.get("io"),
      req.app.get("userIdSocketMap"),
      userId
    ).then();

    // 推送用户金币余额
    pushCoinBalance(
      req.app.get("io"),
      req.app.get("userIdSocketMap"),
      userId,
      user.coinBalance
    ).then();

    res.status(200).json({
      checkedDays: checkedDays,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  const { avatar, username, city, longitude, latitude, language } = req.body;
  const userId = req.user.userId; // 从请求中获取用户 ID

  // 查找用户
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return next(err);
  }

  // 如果找不到用户，返回 404 错误
  if (!user) {
    return res.status(404).json({ message: "用户不存在" });
  }

  // 更新用户资料
  if (avatar) {
    user.avatar = avatar;
  }
  if (username) {
    user.username = username;
  }
  if (city) {
    user.city = city;
  }
  if (longitude && latitude) {
    user.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
  }
  if (language) {
    user.language = language;
  }

  // 保存用户资料
  try {
    await user.save();

    // 更新用户的位置信息后，调用相应的处理函数
    if (longitude && latitude) {
      const io = req.app.get("io");
      const userIdSocketMap = req.app.get("userIdSocketMap");
      pushNearestUsers(io, userIdSocketMap, userId).then();
      processUsersWithLocation(io, userIdSocketMap, user.id)
        .then()
        .catch((error) => {
          errorMonitoringService.monitorError(error).then();
          console.error("processUsersWithLocation error: ", error);
        });
    }

    res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
};

const getUserDetails = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // 验证 userId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = await User.findById(userId)
      .select(
        "avatar username city followingCount followersCount visitorsCount"
      )
      .exec();

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const userDetails = {
      avatar: user.avatar,
      username: user.username,
      city: user.city,
      followingCount: user.followingCount,
      followersCount: user.followersCount,
      visitorsCount: user.visitorsCount,
    };

    // 如果当前登录用户不是该用户，则创建通知
    if (req.user.userId !== userId) {
      const statusNotification = new StatusNotification({
        toUser: userId,
        user: req.user.userId,
        statusType: 1, // 访问主页状态类型
      });

      await statusNotification.save();

      await pushUnreadNotificationsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        userId
      );

      user.visitorsCount++;
      userDetails.visitorsCount++;
      await user.save();

      await pushVisitorsCount(
        req.app.get("io"),
        req.app.get("userIdSocketMap"),
        userId,
        user.visitorsCount
      );
    }

    res.status(200).json(userDetails);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  uploadAvatar,
  followUser,
  blockUser,
  getFollowingUsers,
  getFollowers,
  getFriends,
  performCheckin,
  updateUserProfile,
  getUserDetails,
  reportUser,
};
