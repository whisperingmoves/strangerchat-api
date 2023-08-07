const chai = require('chai');
const chaiHttp = require('chai-http');
const { it, beforeEach, afterEach, describe } = require('mocha');
const ioClient = require('socket.io-client');
const app = require('../../app');
const config = require('../../config');
const User = require('../../models/User');
const {calculateDistance} = require("../../utils/distanceUtils");

chai.use(chaiHttp);
chai.should();

describe('Messages Socket', () => {
    let mobile;
    let user;
    let token;
    let socket;

    let otherMobile;
    let otherUser;
    let otherToken;
    let otherSocket;

    let opponentDistance;

    beforeEach(async () => {
        // 生成随机的经度和纬度
        const longitude = 121.5 + Math.random() * 0.01;
        const latitude = 31.2 + Math.random() * 0.01;

        mobile = '135' + Math.floor(Math.random() * 1000000000);

        otherMobile = '135' + Math.floor(Math.random() * 1000000000);

        try {
            // 注册用户并获取 token
            const registerRes = await chai
                .request(app)
                .post('/users/register')
                .send({
                    mobile: mobile,
                    gender: 'male',
                    birthday: '2000-01-01',
                    avatar: 'avatar.png',
                    longitude: longitude.toString(),
                    latitude: latitude.toString(),
                });

            token = registerRes.body.token;

            // 通过手机号查找用户
            user = await User.findOne({ mobile: mobile });

            // 设置用户名
            user.username = '张三';
            await user.save();

            // 注册另一个用户并保存结果
            const registerOtherRes = await chai
                .request(app)
                .post('/users/register')
                .send({
                    mobile: otherMobile,
                    gender: 'female',
                    birthday: '1995-01-01',
                    avatar: 'avatar2.png',
                    longitude: (longitude + 0.0001).toString(),
                    latitude: latitude.toString(),
                });

            otherToken = registerOtherRes.body.token;

            // 通过其他手机号查找其他用户
            otherUser = await User.findOne({ mobile: otherMobile });

            // 设置其他用户名
            otherUser.username = '李四';
            await otherUser.save();

            // 双方距离
            opponentDistance = calculateDistance(user.location.coordinates, otherUser.location.coordinates);
        } catch (error) {
            throw error;
        }
    });

    describe('Create Chat Conversation', () => {
        it('should receive created conversation notification on both users', (done) => {
            // 创建带有认证信息的 WebSocket 连接
            socket = ioClient(`http://localhost:${config.port}`, {
                auth: {
                    token: token
                }
            });

            // 创建带有认证信息的其他用户 WebSocket 连接
            otherSocket = ioClient(`http://localhost:${config.port}`, {
                auth: {
                    token: otherToken
                }
            });

            // 创建标志变量来跟踪断言状态
            let socketAssertion = false;
            let otherSocketAssertion = false;

            // 监听连接成功事件
            socket.on('connect', () => {
                // 监听 WebSocket 推送消息
                socket.on('notifications', (message) => {
                    // 只处理创建的聊天会话对象消息
                    if (message.type !== 3) {
                        return;
                    }

                    // 对方距我距离
                    const opponentDistance = calculateDistance(user.location.coordinates, otherUser.location.coordinates);

                    // 验证会话对象的结构和属性
                    const conversation = message.data;
                    chai.expect(conversation).to.have.property('conversationId');
                    chai.expect(conversation).to.have.property('opponentUserId');
                    chai.expect(conversation).to.have.property('opponentAvatar');
                    chai.expect(conversation).to.have.property('opponentUsername');
                    chai.expect(conversation).to.have.property('opponentOnlineStatus');
                    chai.expect(conversation).to.have.property('opponentDistance');

                    // 验证会话对象的属性值
                    chai.expect(conversation.conversationId).to.be.a('string');
                    chai.expect(conversation.opponentUserId).to.be.a('string');
                    chai.expect(conversation.opponentAvatar).to.be.a('string');
                    chai.expect(conversation.opponentUsername).to.be.a('string');
                    chai.expect(conversation.opponentOnlineStatus).to.be.a('number');
                    chai.expect(conversation.opponentDistance).to.be.a('number');

                    // 验证会话对象的属性值与预期值是否匹配
                    chai.expect(conversation.opponentUserId).to.equal(otherUser.id);
                    chai.expect(conversation.opponentAvatar).to.equal(otherUser.avatar);
                    chai.expect(conversation.opponentUsername).to.equal(otherUser.username);
                    chai.expect(conversation.opponentOnlineStatus).to.equal(1);
                    chai.expect(conversation.opponentDistance).to.be.equal(opponentDistance);

                    // 设置断言标志为true
                    socketAssertion = true;
                });
            });

            // 其他用户监听连接成功事件
            otherSocket.on('connect', () => {
                // 监听 WebSocket 推送消息
                otherSocket.on('notifications', (message) => {
                    // 只处理创建的聊天会话对象消息
                    if (message.type !== 3) {
                        return;
                    }

                    // 验证会话对象的结构和属性
                    const conversation = message.data;
                    chai.expect(conversation).to.have.property('conversationId');
                    chai.expect(conversation).to.have.property('opponentUserId');
                    chai.expect(conversation).to.have.property('opponentAvatar');
                    chai.expect(conversation).to.have.property('opponentUsername');
                    chai.expect(conversation).to.have.property('opponentOnlineStatus');
                    chai.expect(conversation).to.have.property('opponentDistance');

                    // 验证会话对象的属性值
                    chai.expect(conversation.conversationId).to.be.a('string');
                    chai.expect(conversation.opponentUserId).to.be.a('string');
                    chai.expect(conversation.opponentAvatar).to.be.a('string');
                    chai.expect(conversation.opponentUsername).to.be.a('string');
                    chai.expect(conversation.opponentOnlineStatus).to.be.a('number');
                    chai.expect(conversation.opponentDistance).to.be.a('number');

                    // 验证会话对象的属性值与预期值是否匹配
                    chai.expect(conversation.opponentUserId).to.equal(user.id);
                    chai.expect(conversation.opponentAvatar).to.equal(user.avatar);
                    chai.expect(conversation.opponentUsername).to.equal(user.username);
                    chai.expect(conversation.opponentOnlineStatus).to.equal(1);
                    chai.expect(conversation.opponentDistance).to.be.equal(opponentDistance);

                    // 设置断言标志为true
                    otherSocketAssertion = true;
                });
            });

            // 检查回调的断言状态
            const intervalId = setInterval(() => {
                if (socketAssertion && otherSocketAssertion) {
                    clearInterval(intervalId);
                    done();
                }
            }, 100);

            // 其他用户客户端推送创建聊天会话消息到服务端
            otherSocket.emit('messages', {
                type: 0,
                data: {
                    opponentUserId: user.id,
                },
            });
        });
    });

    describe('Get Recent Chat Conversations', () => {
        it('should receive recent conversations notification on current user', (done) => {
            // 创建带有认证信息的 WebSocket 连接
            socket = ioClient(`http://localhost:${config.port}`, {
                auth: {
                    token: token
                }
            });

            // 其他用户监听连接成功事件
            socket.on('connect', () => {
                // 监听 WebSocket 推送消息
                socket.on('notifications', (message) => {
                    // 如果是聊天会话对象消息
                    if (message.type === 3) {
                        // 验证会话对象的结构和属性
                        const conversation = message.data;
                        chai.expect(conversation).to.have.property('conversationId');

                        // 验证会话对象的属性值
                        chai.expect(conversation.conversationId).to.be.a('string');

                        // 获取会话id
                        const conversationId = conversation.conversationId;

                        // 其他用户客户端推送发送消息到服务端
                        socket.emit('messages', {
                            type: 4,
                            data: {
                                conversationId,
                                opponentUserId: otherUser.id,
                                content: 'Hello'
                            },
                        });

                        return;
                    }

                    // 如果是发送的消息对象消息
                    if (message.type === 7) {
                        // 验证消息对象的结构和属性
                        const messageData = message.data;
                        chai.expect(messageData).to.have.property('sentTime');

                        // 验证消息对象的属性值
                        chai.expect(messageData.sentTime).to.be.a('number');

                        // 客户端推送获取最近的聊天会话列表消息到服务端
                        socket.emit('messages', {
                            type: 1,
                            data: {
                                timestamp: messageData.sentTime
                            },
                        });

                        return;
                    }

                    // 如果是最近的聊天会话列表消息
                    if (message.type === 4) {
                        // 验证消息的结构和属性
                        const conversations = message.data;
                        chai.expect(conversations).to.be.an('array').that.is.not.empty;

                        for (const conversation of conversations) {
                            // 验证会话对象的结构和属性
                            chai.expect(conversation).to.have.property('conversationId');
                            chai.expect(conversation).to.have.property('opponentUserId');
                            chai.expect(conversation).to.have.property('opponentAvatar');
                            chai.expect(conversation).to.have.property('opponentUsername');
                            chai.expect(conversation).to.have.property('opponentOnlineStatus');
                            chai.expect(conversation).to.have.property('opponentDistance');
                            chai.expect(conversation).to.have.property('lastMessageTime');
                            chai.expect(conversation).to.have.property('lastMessageContent');
                            chai.expect(conversation).to.have.property('unreadCount');

                            // 验证会话对象的属性值
                            chai.expect(conversation.conversationId).to.be.a('string');
                            chai.expect(conversation.opponentUserId).to.be.a('string');
                            chai.expect(conversation.opponentAvatar).to.be.a('string');
                            chai.expect(conversation.opponentUsername).to.be.a('string');
                            chai.expect(conversation.opponentOnlineStatus).to.be.a('number');
                            chai.expect(conversation.opponentDistance).to.be.a('number');
                            chai.expect(conversation.lastMessageTime).to.be.a('number');
                            chai.expect(conversation.lastMessageContent).to.be.a('string');
                            chai.expect(conversation.unreadCount).to.be.a('number');

                            // 验证会话对象的属性值与预期值是否匹配
                            chai.expect(conversation.opponentUserId).to.equal(otherUser.id);
                            chai.expect(conversation.opponentAvatar).to.equal(otherUser.avatar);
                            chai.expect(conversation.opponentUsername).to.equal(otherUser.username);
                            chai.expect(conversation.opponentOnlineStatus).to.equal(0);
                            chai.expect(conversation.opponentDistance).to.be.equal(opponentDistance);
                            chai.expect(conversation.unreadCount).to.be.equal(0);

                            done();
                        }
                    }
                });
            });

            // 推送创建聊天会话消息到服务端
            socket.emit('messages', {
                type: 0,
                data: {
                    opponentUserId: otherUser.id,
                },
            });
        });
    });

    afterEach(async () => {
        // 关闭 WebSocket 连接
        if (socket.connected) {
            socket.disconnect();
        }
        if (otherSocket.connected) {
            otherSocket.disconnect();
        }

        try {
            // 删除测试用户
            await User.deleteOne({ mobile: mobile });
            await User.deleteOne({ mobile: otherMobile });
        } catch (err) {
            throw err;
        }
    });
});
