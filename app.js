const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
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

app.use(errorMiddleware);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}...`)
})

module.exports = app;
