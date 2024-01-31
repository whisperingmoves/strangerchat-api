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

const Verification = require("../models/Verification");
const { generateVerifyCode, jwtSecret } = require("../config");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const sendVerificationCode = async (req, res) => {
  const mobile = req.body.mobile;

  // 检查手机号格式是否正确
  if (!mobile) return res.status(400).json({ message: "手机号格式错误" });

  // 生成验证码
  const code = generateVerifyCode();

  // 查找现有的验证码记录
  let verification = await Verification.findOne({ mobile });

  if (verification) {
    // 更新现有的验证码记录
    verification.code = code;
  } else {
    // 创建新的验证码记录
    verification = new Verification({ mobile, code });
  }

  // 保存验证码
  await verification.save();

  if (process.env.NODE_ENV === "test") {
    // 测试环境
    res.json({
      code, // 返回生成的验证码
    });
  } else {
    // 发送验证码到手机上
    sendMessage(mobile, code);

    res.sendStatus(200);
  }
};

const verifyVerificationCode = async (req, res) => {
  const { mobile, code, longitude, latitude, language } = req.body;

  // 校验验证码
  const verification = await Verification.findOne({ mobile, code });
  if (!verification) return res.status(400).json({ message: "验证码错误" });

  // 获取用户信息
  const user = await User.findOne({ mobile });

  if (user) {
    // 用户存在
    const token = jwt.sign({ userId: user.id }, jwtSecret);

    // 保存地理位置
    if (longitude && latitude) {
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
      await user.save();
    }

    // 保存语言代码
    if (language) {
      user.language = language;
      await user.save();
    }

    // 格式化 birthday 字段
    const formattedBirthday = user.birthday
      ? user.birthday.toISOString().split("T")[0]
      : undefined;

    // 格式化 lastCheckDate 字段为精确到秒的 UNIX 时间戳
    const formattedLastCheckDate = user.lastCheckDate
      ? Math.floor(user.lastCheckDate.getTime() / 1000)
      : undefined;

    // 返回响应，包括 checkedDays、lastCheckDate 和 formattedBirthday 字段
    res.json({
      token,
      userId: user.id,
      gender: user.gender,
      birthday: formattedBirthday,
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
      lastCheckDate: formattedLastCheckDate,
    });
  } else {
    // 用户不存在
    res.status(201).json({});
  }
};

// function checkMobile(mobile) {
//     const re = /^1[3-9]\d{9}$/;
//     return re.test(mobile);
// }

function sendMessage(mobile, code) {
  console.log("向" + mobile + "发送短信验证码" + code);
}

module.exports = { sendVerificationCode, verifyVerificationCode };
