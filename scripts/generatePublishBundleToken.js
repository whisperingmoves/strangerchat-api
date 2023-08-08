const jwt = require("jsonwebtoken");
const config = require("../config");

const generatePublishBundleToken = () => {
  return jwt.sign(
    { publishBundleKey: config.publishBundleKey },
    config.jwtPublishBundleSecret
  );
};

console.log(generatePublishBundleToken());
