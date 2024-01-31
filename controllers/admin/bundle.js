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

const Bundle = require("../../models/Bundle");
const { Types } = require("mongoose");

const onlineBundle = async (req, res, next) => {
  const bundleId = req.params.bundleId;

  try {
    // 验证 bundleId 是否是有效的 ObjectId
    if (!Types.ObjectId.isValid(bundleId)) {
      return res.status(404).json({ message: "未找到指定的 Bundle" });
    }

    // 查找 Bundle 对象并更新
    const bundle = await Bundle.findByIdAndUpdate(
      bundleId,
      { online: 1 },
      { new: true }
    );

    if (!bundle) {
      return res.status(404).json({ message: "未找到指定的 Bundle" });
    }

    res.json({ message: "Bundle 上线成功" });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const createBundle = async (req, res, next) => {
  try {
    const { url, version, online } = req.body;

    const bundle = await Bundle.create({ url, version, online });

    res.status(201).json({ id: bundle.id });
  } catch (error) {
    next(error);
  }
};

const deleteBundles = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await Bundle.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getBundleList = async (req, res, next) => {
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

    const filter = keyword ? { url: { $regex: new RegExp(keyword, "i") } } : {};

    const [total, bundles] = await Promise.all([
      Bundle.countDocuments(filter),
      Bundle.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .select("-__v")
        .lean(),
    ]);

    const formattedBundles = bundles.map((bundle) => ({
      id: bundle.id,
      url: bundle.url,
      version: bundle.version,
      online: bundle.online,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedBundles,
    });
  } catch (error) {
    next(error);
  }
};

const updateBundle = async (req, res, next) => {
  try {
    const { url, version, online } = req.body;
    const { bundleId } = req.params;

    const bundle = await Bundle.findByIdAndUpdate(
      bundleId,
      { url, version, online, updatedAt: Date.now() },
      { new: true }
    );

    if (!bundle) {
      return res.status(404).json({ message: "Bundle不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  onlineBundle,
  createBundle,
  deleteBundles,
  getBundleList,
  updateBundle,
};
