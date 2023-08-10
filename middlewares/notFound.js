module.exports = (req, res) => {
  res.status(404).json({ message: "找不到页面" });
};
