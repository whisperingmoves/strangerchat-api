const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path'); // 引入 path 模块
const config = require('./config');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error');

// 模块定义
const swaggerDocument = YAML.load('./docs/openapi.yaml');

const app = express();

mongoose.connect(config.dbUrl);

// 路由定义
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(routes);

// 静态文件访问
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(config.avatarUploadPath)); // 将上传文件目录暴露为静态资源

app.use(errorMiddleware);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}...`)
});

// 捕捉未经处理的同步异常
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1); // 终止进程
});

// 捕捉未经处理的异步异常
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1); // 终止进程
});

module.exports = app;