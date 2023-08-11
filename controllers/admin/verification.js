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

module.exports = { createVerification };
