// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
