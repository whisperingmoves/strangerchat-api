const chai = require('chai');
const chaiHttp = require('chai-http');
const { it, beforeEach, describe } = require('mocha');
const ioClient = require('socket.io-client');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const config = require('../../config');

chai.use(chaiHttp);
chai.should();

describe('WebSocket Authentication', () => {
    let token;
    let socket;
    let mobile;

    beforeEach(async () => {
        // 生成随机的手机号
        mobile = '135' + Math.floor(Math.random() * 1000000000);

        // 注册用户并获取token
        const response = await chai.request(app)
            .post('/users/register')
            .send({
                mobile: mobile,
                gender: 'male',
                birthday: '2000-01-01',
                avatar: 'avatar.png',
            });

        token = response.body.token;
    });

    it('should connect to WebSocket with valid token', done => {
        // 创建带有认证信息的WebSocket连接
        socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token
            }
        });

        // 监听连接成功事件
        socket.on('connect', () => {
            done();
        });
    });

    it('should return error when connecting to WebSocket without token', done => {
        // 创建没有认证信息的WebSocket连接
        socket = ioClient(`http://localhost:${config.port}`);

        // 监听连接错误事件
        socket.on('connect_error', (error) => {
            chai.expect(error.message).to.equal('请先登录');
            done();
        });
    });

    it('should return error when connecting to WebSocket with invalid token', done => {
        // 生成无效的token
        const invalidToken = jwt.sign({ userId: 'testuser' }, 'invalid_secret');

        // 创建带有无效token的WebSocket连接
        socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: invalidToken
            }
        });

        // 监听连接错误事件
        socket.on('connect_error', (error) => {
            chai.expect(error.message).to.equal('认证失败');
            done();
        });
    });

    afterEach(() => {
        // 关闭WebSocket连接
        if (socket.connected) {
            socket.disconnect();
        }
    });
});