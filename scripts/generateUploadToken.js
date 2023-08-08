const jwt = require("jsonwebtoken");
const config = require("../config");

const generateUploadToken = () => {
  return jwt.sign({ uploadKey: config.uploadKey }, config.jwtUploadSecret);
};

console.log(generateUploadToken());
