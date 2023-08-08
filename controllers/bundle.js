const Bundle = require("../models/Bundle");
const { Types } = require("mongoose");

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
  onlineBundle,
  refreshBundle,
};
