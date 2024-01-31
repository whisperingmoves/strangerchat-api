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

const Gift = require("../models/Gift");
const GiftService = require("../services/GiftService");
const User = require("../models/User");
const mongoose = require("mongoose");
const moment = require("moment");

const getGiftList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    let gifts = await Gift.find({})
      .skip(skip)
      .limit(pageSize)
      .select("-__v")
      .lean();

    gifts = gifts.map((gift) => ({
      id: gift._id,
      image: gift.image,
      name: gift.name,
      value: gift.value,
    }));

    res.status(200).json(gifts);
  } catch (error) {
    next(error);
  }
};

const sendGift = async (req, res, next) => {
  const { receiverId, giftId, quantity } = req.body;

  try {
    // 验证 receiverId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(404).json({ message: "接收礼物的用户不存在" });
    }

    // 验证 giftId 是否是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(giftId)) {
      return res.status(404).json({ message: "礼物不存在" });
    }

    // 检查接收礼物的用户是否存在
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "接收礼物的用户不存在" });
    }

    // 检查礼物是否存在
    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({ message: "礼物不存在" });
    }

    // 获取当前用户的ID，假设用户认证信息保存在请求的user对象中
    const senderId = req.user.userId;

    // 检查当前用户的金币余额是否足够购买礼物
    const totalPrice = gift.value * quantity;
    const sender = await User.findById(senderId);
    if (sender.coinBalance < totalPrice) {
      return res.status(400).json({ message: "金币余额不足" });
    }

    await GiftService.sendGift(
      sender,
      receiver,
      gift,
      quantity,
      req.app.get("io"),
      req.app.get("userIdSocketMap")
    );

    res.json({});
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const getReceivedGiftStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    const { range } = req.query;
    let startDate, endDate;

    switch (range) {
      case "2":
        startDate = moment().subtract(1, "month").startOf("day").toDate();
        endDate = moment().endOf("day").toDate();
        break;
      case "1":
        startDate = moment().subtract(1, "week").startOf("day").toDate();
        endDate = moment().endOf("day").toDate();
        break;
      default:
        startDate = moment(user.createdAt).startOf("day").toDate();
        endDate = moment().endOf("day").toDate();
    }

    const stats = await user.getReceivedGiftStats(startDate, endDate);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGiftList,
  sendGift,
  getReceivedGiftStats,
};
