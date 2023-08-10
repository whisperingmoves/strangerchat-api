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

module.exports = {
  createUser,
};
