const jwt = require("jsonwebtoken");
const config = require("../config");

const generateMonitorToken = () => {
  return jwt.sign({ monitorKey: config.monitorKey }, config.jwtMonitorSecret);
};

console.log(generateMonitorToken());
