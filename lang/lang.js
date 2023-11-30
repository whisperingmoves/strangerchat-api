const sprintf = require("sprintf-js").sprintf;

const fs = require("fs");
const path = require("path");

function getLangMap() {
  const langMap = {};

  // 读取 lang 目录下的所有 JavaScript 文件
  const langFiles = fs.readdirSync(path.join(__dirname));

  // 循环遍历每个文件
  langFiles.forEach((file) => {
    if (file.endsWith(".js") && file !== "lang.js") {
      // 排除 lang.js 文件
      const filePath = path.join(__dirname, file);

      // 动态导入 JavaScript 文件
      const module = require(filePath);

      // 合并 langMap
      Object.entries(module).forEach(([key, value]) => {
        if (key in langMap) {
          langMap[key] = { ...langMap[key], ...value };
        } else {
          langMap[key] = value;
        }
      });
    }
  });

  return langMap;
}

exports.__ = function (name = null, vars = [], lang = "en") {
  const langMap = getLangMap();
  if (!(lang in langMap[name])) {
    lang = "en";
  }
  let value = langMap[name][lang];
  if (vars.length > 0 && Array.isArray(vars)) {
    vars.unshift(value);
    value = sprintf.apply(null, vars);
  }
  return value;
};
