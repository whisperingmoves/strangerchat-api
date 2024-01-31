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

const config = require("../config");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AdminUser = require("../models/AdminUser");
const {
  generateRandomUsername,
  generateStrongPassword,
} = require("../utils/authUtils");

const generateAdminUser = async () => {
  try {
    // 连接数据库
    await mongoose.connect(config.dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 生成随机的用户名
    const username = generateRandomUsername();

    // 生成高强度密码
    const password = generateStrongPassword();

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash(password, config.saltRounds);
    const adminUser = new AdminUser({
      username: username,
      password: hashedPassword,
    });
    await adminUser.save();

    // 断开数据库连接
    await mongoose.disconnect();

    // 返回用户名和密码
    return { username, password };
  } catch (error) {
    console.error("Error generating admin user:", error);
    throw error;
  }
};

generateAdminUser()
  .then(({ username, password }) => {
    console.log("Admin user created successfully!");
    console.log("Username:", username);
    console.log("Password:", password);
  })
  .catch((error) => {
    console.error("Failed to generate admin user:", error);
  });
