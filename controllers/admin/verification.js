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

module.exports = {
  createVerification,
  deleteVerifications,
  getVerificationList,
};
