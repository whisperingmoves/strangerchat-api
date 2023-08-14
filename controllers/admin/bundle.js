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

module.exports = {
  onlineBundle,
  createBundle,
  deleteBundles,
};
