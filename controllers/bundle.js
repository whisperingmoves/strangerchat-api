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

const Bundle = require("../models/Bundle");

const uploadBundle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "请选择文件上传" });
    }

    res.json({ url: req.file.path });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const publishBundle = async (req, res, next) => {
  const { url, version } = req.body;

  // 校验参数
  if (!url || !version) {
    return res.status(400).json({ message: "请提供完整的 Bundle 信息" });
  }

  try {
    // 创建 Bundle 对象
    const bundle = new Bundle({
      url,
      version,
    });

    // 保存 Bundle
    await bundle.save();

    res.json({ bundleId: bundle.id });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

const refreshBundle = async (req, res, next) => {
  try {
    // 查询最新的 online 值为 1 的 Bundle 文档
    const bundle = await Bundle.findOne({ online: 1 }).sort({ updatedAt: -1 });

    if (!bundle) {
      return res.status(404).json({ message: "未找到可用的 Bundle" });
    }

    res.json({ url: bundle.url });
  } catch (err) {
    next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
  }
};

module.exports = {
  uploadBundle,
  publishBundle,
  refreshBundle,
};
