const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const config = require('./config');
const routes = require('./routes');
const Post = require('./models/Post');
const User = require('./models/User');
const errorMiddleware = require('./middlewares/error');

// 模块定义
const swaggerDocument = YAML.load('./docs/openapi.yaml');

const app = express();

mongoose.connect(config.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// 在连接成功时创建地理索引
mongoose.connection.once('open', async () => {
    try {
        // 创建用户模型的地理索引
        await User.createIndexes({ location: '2dsphere' });
        // 创建帖子模型的地理索引
        await Post.createIndexes({ location: '2dsphere' });
        console.log('地理索引创建成功！');
    } catch (error) {
        console.error('创建地理索引时出错：', error);
    }
});

// 路由定义
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(routes);

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
