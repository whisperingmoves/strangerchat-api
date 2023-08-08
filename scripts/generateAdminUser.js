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
