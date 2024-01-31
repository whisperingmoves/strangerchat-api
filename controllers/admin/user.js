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
      blockedUsers,
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
      blockedUsers,
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
      blockedUsers: user.blockedUsers,
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

const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: updates,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  deleteUsers,
  getUserList,
  updateUser,
};
