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

const Gift = require("../../models/Gift");
const GiftHistory = require("../../models/GiftHistory");

const createGift = async (req, res, next) => {
  try {
    const { image, name, value } = req.body;

    const gift = await Gift.create({ image, name, value });

    res.status(201).json({ id: gift.id });
  } catch (error) {
    next(error);
  }
};

const deleteGifts = async (req, res, next) => {
  try {
    const { ids } = req.query;

    // 删除礼物
    await Gift.deleteMany({ _id: { $in: ids } });

    // 删除关联礼物历史
    await GiftHistory.deleteMany({ gift: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getGiftList = async (req, res, next) => {
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
      ? { name: { $regex: new RegExp(keyword, "i") } }
      : {};

    const [total, gifts] = await Promise.all([
      Gift.countDocuments(filter),
      Gift.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .select("-__v")
        .lean(),
    ]);

    const formattedGifts = gifts.map((gift) => ({
      id: gift._id,
      image: gift.image,
      name: gift.name,
      value: gift.value,
      createdAt: gift.createdAt,
      updatedAt: gift.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedGifts,
    });
  } catch (error) {
    next(error);
  }
};

const updateGift = async (req, res, next) => {
  try {
    const { image, name, value } = req.body;
    const { giftId } = req.params;

    const gift = await Gift.findByIdAndUpdate(
      giftId,
      { image, name, value, updatedAt: Date.now() },
      { new: true }
    );

    if (!gift) {
      return res.status(404).json({ message: "礼物不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGift,
  deleteGifts,
  getGiftList,
  updateGift,
};
