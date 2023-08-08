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
