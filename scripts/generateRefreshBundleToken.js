const jwt = require("jsonwebtoken");
const config = require("../config");

const generateRefreshBundleToken = () => {
  return jwt.sign(
    { refreshBundleKey: config.refreshBundleKey },
    config.jwtRefreshBundleSecret
  );
};

console.log(generateRefreshBundleToken());
