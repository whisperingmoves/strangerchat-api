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

const Verification = require("../../models/Verification");

const createVerification = async (req, res, next) => {
  try {
    const { mobile, code } = req.body;

    const verification = await Verification.create({ mobile, code });

    res.status(201).json({ id: verification.id });
  } catch (error) {
    next(error);
  }
};

const deleteVerifications = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await Verification.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getVerificationList = async (req, res, next) => {
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
      ? { mobile: { $regex: new RegExp(keyword, "i") } }
      : {};

    const [total, verifications] = await Promise.all([
      Verification.countDocuments(filter),
      Verification.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .select("-__v")
        .lean(),
    ]);

    const formattedVerifications = verifications.map((verification) => ({
      id: verification._id,
      mobile: verification.mobile,
      code: verification.code,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedVerifications,
    });
  } catch (error) {
    next(error);
  }
};

const updateVerification = async (req, res, next) => {
  try {
    const { code, mobile } = req.body;
    const { verificationId } = req.params;

    const verification = await Verification.findByIdAndUpdate(
      verificationId,
      { code, mobile, updatedAt: Date.now() },
      { new: true }
    );

    if (!verification) {
      return res.status(404).json({ message: "验证码不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVerification,
  deleteVerifications,
  getVerificationList,
  updateVerification,
};
