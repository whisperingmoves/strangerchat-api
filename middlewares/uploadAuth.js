const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(401).json({ message: "请先登录" });

  jwt.verify(token, config.jwtUploadSecret, (err, decoded) => {
    if (err || decoded.uploadKey !== config.uploadKey)
      return res.status(401).json({ message: "认证失败" });
    next(); // 返回请求
  });
};
