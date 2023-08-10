const User = require("../../models/User");

const createUser = async (req, res, next) => {
  try {
    const {
      mobile,
      gender,
      birthday,
      avatar,
      giftsReceived,
      username,
      city,
      followingCount,
      followersCount,
      visitorsCount,
      freeHeatsLeft,
      coinBalance,
      checkedDays,
      lastCheckDate,
      location,
      following,
      receivedGiftRankings,
      online,
    } = req.body;

    const user = await User.create({
      mobile,
      gender,
      birthday,
      avatar,
      giftsReceived,
      username,
      city,
      followingCount,
      followersCount,
      visitorsCount,
      freeHeatsLeft,
      coinBalance,
      checkedDays,
      lastCheckDate,
      location,
      following,
      receivedGiftRankings,
      online,
    });

    res.status(201).json({ id: user.id });
  } catch (error) {
    next(error);
  }
};

const deleteUsers = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await User.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getUserList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = keyword
      ? { username: { $regex: new RegExp(keyword, "i") } }
      : {};

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .select("-__v")
        .lean(),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user._id,
      mobile: user.mobile,
      gender: user.gender,
      birthday: user.birthday,
      avatar: user.avatar,
      giftsReceived: user.giftsReceived,
      username: user.username,
      city: user.city,
      followingCount: user.followingCount,
      followersCount: user.followersCount,
      visitorsCount: user.visitorsCount,
      freeHeatsLeft: user.freeHeatsLeft,
      coinBalance: user.coinBalance,
      checkedDays: user.checkedDays,
      lastCheckDate: user.lastCheckDate,
      location: user.location,
      following: user.following,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      receivedGiftRankings: user.receivedGiftRankings,
      online: user.online,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  deleteUsers,
  getUserList,
};
