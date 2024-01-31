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

// 生成随机的用户名
const generateRandomUsername = () => {
  const randomString = Math.random().toString(36).substring(2); // 生成随机字符串
  // 在随机字符串前添加前缀
  return `admin_${randomString}`;
};

// 生成高强度密码
const generateStrongPassword = () => {
  const length = 10; // 密码长度
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"; // 包含在密码中的字符集合
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length); // 生成随机索引
    password += characters.charAt(randomIndex); // 根据索引获取字符并添加到密码中
  }
  return password;
};

module.exports = {
  generateRandomUsername,
  generateStrongPassword,
};
