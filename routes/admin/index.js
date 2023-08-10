const fs = require("fs");
const path = require("path");
const express = require("express");

const router = express.Router();

const routesDirectory = path.join(__dirname);

// 动态加载和应用当前目录下的所有路由文件
fs.readdirSync(routesDirectory).forEach((file) => {
  if (file !== "index.js") {
    if (file.endsWith(".js")) {
      file = file.replace(".js", "");
    }
    const route = require(`./${file}`);
    router.use("/admin", route);
  }
});

module.exports = router;
