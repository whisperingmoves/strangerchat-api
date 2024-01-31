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

const GiftHistory = require("../../models/GiftHistory");

const createGiftHistory = async (req, res, next) => {
  try {
    const { sender, receiver, gift, quantity } = req.body;

    const giftHistory = await GiftHistory.create({
      sender,
      receiver,
      gift,
      quantity,
    });

    res.status(201).json({ id: giftHistory.id });
  } catch (error) {
    next(error);
  }
};

const deleteGiftHistories = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await GiftHistory.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getGiftHistoryList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      senderId,
      receiverId,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (senderId) filter["sender"] = senderId;
    if (receiverId) filter["receiver"] = receiverId;

    const [total, giftHistories] = await Promise.all([
      GiftHistory.countDocuments(filter),
      GiftHistory.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("sender", "username")
        .populate("receiver", "username")
        .populate("gift", "image name value")
        .select("-__v")
        .lean(),
    ]);

    const formattedGiftHistories = giftHistories.map((history) => ({
      id: history._id,
      sender: {
        id: history.sender._id,
        username: history.sender.username,
      },
      receiver: {
        id: history.receiver._id,
        username: history.receiver.username,
      },
      gift: {
        id: history.gift._id,
        image: history.gift.image,
        name: history.gift.name,
        value: history.gift.value,
      },
      quantity: history.quantity,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedGiftHistories,
    });
  } catch (error) {
    next(error);
  }
};

const updateGiftHistory = async (req, res, next) => {
  try {
    const { sender, receiver, gift, quantity } = req.body;
    const { giftHistoryId } = req.params;

    const giftHistory = await GiftHistory.findByIdAndUpdate(
      giftHistoryId,
      { sender, receiver, gift, quantity, updatedAt: Date.now() },
      { new: true }
    );

    if (!giftHistory) {
      return res.status(404).json({ message: "礼物历史不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGiftHistory,
  deleteGiftHistories,
  getGiftHistoryList,
  updateGiftHistory,
};
