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

module.exports = { createVerification, deleteVerifications };
