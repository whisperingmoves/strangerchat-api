const chai = require('chai');
const chaiHttp = require('chai-http');
const { it, beforeEach, afterEach, describe } = require('mocha');
const ioClient = require('socket.io-client');
const app = require('../../app');
const config = require('../../config');
const User = require('../../models/User');
const InteractionNotification = require('../../models/InteractionNotification');
const StatusNotification = require('../../models/StatusNotification');
const GiftNotification = require('../../models/GiftNotification');
const SystemNotification = require('../../models/SystemNotification');
const {calculateDistance} = require("../../utils/distanceUtils");

chai.use(chaiHttp);
chai.should();

describe('Notifications Socket', () => {
    let token;
    let socket;
    let mobile;
    let user;
    let nearbyUsers = [];
    let otherUser;
    let otherToken;
    let postId;

    beforeEach(async () => {
        // 生成随机的经度和纬度
        const longitude = 121.5 + Math.random() * 0.01;
        const latitude = 31.2 + Math.random() * 0.01;

        // 生成随机的手机号
        mobile = '135' + Math.floor(Math.random() * 1000000000);

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

            // 注册另一个用户并保存结果
            const otherUserMobile = '135' + Math.floor(Math.random() * 1000000000);
            const registerOtherRes = await chai
                .request(app)
                .post('/users/register')
                .send({
                    mobile: otherUserMobile,
                    gender: 'female',
                    birthday: '1995-01-01',
                    avatar: 'avatar2.png',
                });

            otherToken = registerOtherRes.body.token;

            otherUser = await User.findOne({ mobile: otherUserMobile });

            // 发布帖子并保存帖子ID
            const postRes = await chai
                .request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: '这是一条帖子内容。',
                    city: '北京',
                    longitude: longitude.toString(),
                    latitude: latitude.toString(),
                    images: ['/uploads/xxx1.png', '/uploads/xxx2.png'],
                });

            postId = postRes.body.postId;

            // 注册5个距离当前用户最近的用户
            const otherUsers = [
                {
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'male',
                    birthday: '1980-01-01',
                    avatar: 'avatar1.png',
                    longitude: (longitude + 0.0001).toString(),
                    latitude: latitude.toString(),
                },
                {
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'female',
                    birthday: '1985-01-01',
                    avatar: 'avatar2.png',
                    longitude: (longitude + 0.0002).toString(),
                    latitude: (latitude + 0.0001).toString(),
                },
                {
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'male',
                    birthday: '2000-01-01',
                    avatar: 'avatar3.png',
                    longitude: (longitude + 0.0003).toString(),
                    latitude: (latitude + 0.0002).toString(),
                },
                {
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'female',
                    birthday: '1995-01-01',
                    avatar: 'avatar4.png',
                    longitude: (longitude + 0.0004).toString(),
                    latitude: (latitude + 0.0003).toString(),
                },
                {
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'male',
                    birthday: '1990-01-01',
                    avatar: 'avatar5.png',
                    longitude: (longitude + 0.0005).toString(),
                    latitude: (latitude + 0.0004).toString(),
                },
            ];

            const promises = otherUsers.map((userInfo) => {
                return new Promise(async (resolve) => {
                    const registerRes = await chai
                        .request(app)
                        .post('/users/register')
                        .send(userInfo);

                    userInfo['userId'] = registerRes.body.userId;
                    resolve(userInfo);
                });
            });

            nearbyUsers = await Promise.all(promises);
        } catch (error) {
            throw error;
        }
    });

    it('should receive nearby users notifications from WebSocket', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token
            }
        });

        // 监听连接成功事件
        socket.on('connect', () => {
            // 等待 WebSocket 推送消息
            let messageReceived = false;

            socket.on('notifications', (message) => {
                // 如果找到符合要求的消息，则进行断言
                if (message.type === 0 && !messageReceived) {
                    messageReceived = true;

                    chai.expect(message).to.deep.equal({
                        type: 0,
                        data: {
                            users: nearbyUsers.map(userInfo => ({
                                userId: userInfo.userId,
                                avatarUrl: userInfo.avatar,
                                distance: calculateDistance(user.location.coordinates, [parseFloat(userInfo.longitude), parseFloat(userInfo.latitude)])
                            }))
                        }
                    });

                    done();
                }
            });
        });
    });

    it('should receive online users notifications from WebSocket', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token
            }
        });

        // 监听连接成功事件
        socket.on('connect', () => {
            // 等待 WebSocket 推送消息
            let messageReceived = false;

            socket.on('notifications', (message) => {
                // 如果找到符合要求的消息，则进行断言
                if (message.type === 1 && !messageReceived) {
                    messageReceived = true;

                    chai.expect(message).to.deep.equal({
                        type: 1,
                        data: {
                            online: 1
                        }
                    });

                    done();
                }
            });
        });
    });

    it('should receive unread notifications count from WebSocket', (done) => {
        // 创建5个不同类型的通知
        const notifications = [
            new InteractionNotification({
                toUser: user.id,
                user: otherUser.id,
                interactionType: 0,
                post: postId
            }),
            new StatusNotification({
                toUser: user.id,
                user: otherUser.id,
                statusType: 1
            }),
            new GiftNotification({
                toUser: user.id,
                user: otherUser.id,
                giftQuantity: 2,
                giftName: "礼物名称"
            }),
            new SystemNotification({
                toUser: user.id,
                notificationTitle: "系统通知",
                notificationContent: "系统通知内容"
            }),
            new InteractionNotification({
                toUser: user.id,
                user: otherUser.id,
                interactionType: 3,
                post: postId
            })
        ];
        const saveNotificationsPromises = notifications.map(notification => {
            return new Promise((resolve, reject) => {
                notification.save((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });

        Promise.all(saveNotificationsPromises)
            .then(() => {
                // 创建带有认证信息的 WebSocket 连接
                socket = ioClient(`http://localhost:${config.port}`, {
                    auth: {
                        token: token
                    }
                });

                // 监听连接成功事件
                socket.on('connect', () => {
                    // 等待 WebSocket 推送消息
                    let messageReceived = false;

                    socket.on('notifications', (message) => {
                        // 如果找到符合要求的消息，则进行断言
                        if (message.type === 2 && !messageReceived) {
                            messageReceived = true;

                            chai.expect(message).to.deep.equal({
                                type: 2,
                                data: {
                                    count: 5
                                }
                            });

                            done();
                        }
                    });
                });
            })
            .catch((err) => {
                done(err);
            });
    });

    it('should receive unread notifications count via WebSocket after liking and unliking a post', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 记录未读通知数推送次数
        let unreadCount = 0;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (unreadCount === 0) {
                    unreadCount++;
                    return;
                }

                // 根据推送的消息次数进行断言
                if (unreadCount === 1 && message.type === 2  && message.data.count === 1) {
                    unreadCount++;
                } else if (unreadCount === 2 && message.type === 2  && message.data.count === 0) {
                    done();
                } else {
                    done(new Error('Unexpected unread notifications count or message count'));
                }
            });

            // 在连接成功后，调用给帖子点赞的接口
            chai.request(app)
                .post(`/posts/${postId}/like?action=1`)
                .set('Authorization', `Bearer ${otherToken}`)
                .end((likeErr) => {
                    if (likeErr) {
                        done(likeErr);
                    }

                    // 调用取消帖子点赞的接口
                    chai.request(app)
                        .post(`/posts/${postId}/like?action=0`)
                        .set('Authorization', `Bearer ${otherToken}`)
                        .end((unlikeErr) => {
                            if (unlikeErr) {
                                done(unlikeErr);
                            }
                        });
                });
        });
    });

    it('should receive unread notifications count via WebSocket after receiving a comment and comment deletion', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 记录未读通知数推送次数
        let unreadCount = 0;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (unreadCount === 0) {
                    unreadCount++;
                    return;
                }

                // 根据推送的消息次数进行断言
                if (unreadCount === 1 && message.type === 2 && message.data.count === 1) {
                    unreadCount++;
                } else if (unreadCount === 2 && message.type === 2  && message.data.count === 0) {
                    done();
                } else {
                    done(new Error('Unexpected unread notifications count or message count'));
                }
            });

            // 在连接成功后，调用给帖子评论的接口
            chai.request(app)
                .post(`/posts/${postId}/comment`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({
                    content: '这是一条评论',
                })
                .end((commentErr, commentRes) => {
                    if (commentErr) {
                        done(commentErr);
                    }

                    // 获取评论ID
                    const commentId = commentRes.body.commentId;

                    // 在评论创建成功后，调用删除评论的接口
                    chai.request(app)
                        .delete(`/comments/${commentId}`)
                        .set('Authorization', `Bearer ${otherToken}`)
                        .end((deleteErr) => {
                            if (deleteErr) {
                                done(deleteErr);
                            }
                        });
                });
        });
    });

    it('should receive unread notifications count via WebSocket after a post is shared', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 标记是否已经接收到第一个未读通知数消息
        let firstUnreadMessageReceived = false;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (!firstUnreadMessageReceived) {
                    firstUnreadMessageReceived = true;
                    return;
                }

                // 对推送的消息进行断言
                chai.expect(message).to.deep.equal({
                    type: 2,
                    data: {
                        count: 1,
                    },
                });

                done();
            });

            // 在连接成功后，调用分享帖子的接口
            chai.request(app)
                .post(`/posts/${postId}/share`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({
                    sharePlatform: 1,
                })
                .end((shareErr) => {
                    if (shareErr) {
                        done(shareErr);
                    }
                });
        });
    });

    it('should receive unread notifications count via WebSocket after post is collected and uncollected', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 记录未读通知数推送次数
        let unreadCount = 0;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (unreadCount === 0) {
                    unreadCount++;
                    return;
                }

                // 根据推送的消息次数进行断言
                if (unreadCount === 1 && message.type === 2 && message.data.count === 1) {
                    unreadCount++;
                } else if (unreadCount === 2 && message.type === 2 && message.data.count === 0) {
                    done();
                } else {
                    done(new Error('Unexpected unread notifications count or message count'));
                }
            });

            // 在连接成功后，调用收藏帖子的接口
            chai.request(app)
                .post(`/posts/${postId}/collect`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({
                    operation: 1,
                })
                .end((collectErr) => {
                    if (collectErr) {
                        done(collectErr);
                    }

                    // 在收藏成功后，调用取消收藏帖子的接口
                    chai.request(app)
                        .post(`/posts/${postId}/collect`)
                        .set('Authorization', `Bearer ${otherToken}`)
                        .send({
                            operation: 0,
                        })
                        .end((uncollectErr) => {
                            if (uncollectErr) {
                                done(uncollectErr);
                            }
                        });
                });
        });
    });

    it('should receive unread notifications count via WebSocket after liking and unliking a comment', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 记录未读通知数推送次数
        let unreadCount = 0;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (unreadCount === 0) {
                    unreadCount++;
                    return;
                }

                // 根据推送的消息次数进行断言
                if (unreadCount === 1 && message.type === 2 && message.data.count === 1) {
                    unreadCount++;
                } else if (unreadCount === 2 && message.type === 2 && message.data.count === 0) {
                    done();
                } else {
                    done(new Error('Unexpected unread notifications count or message count'));
                }
            });

            // 在连接成功后，调用评论帖子/回复评论的接口
            chai.request(app)
                .post(`/posts/${postId}/comment`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: '这是一条评论',
                })
                .end((commentErr, commentRes) => {
                    if (commentErr) {
                        done(commentErr);
                    }

                    const commentId = commentRes.body.commentId;

                    // 使用获取到的评论ID调用点赞评论的接口
                    chai.request(app)
                        .post(`/comments/${commentId}/like`)
                        .set('Authorization', `Bearer ${otherToken}`)
                        .send({
                            operation: 1,
                        })
                        .end((likeErr) => {
                            if (likeErr) {
                                done(likeErr);
                            }

                            // 在点赞成功后，调用取消点赞评论的接口
                            chai.request(app)
                                .post(`/comments/${commentId}/like`)
                                .set('Authorization', `Bearer ${otherToken}`)
                                .send({
                                    operation: 0,
                                })
                                .end((unlikeErr) => {
                                    if (unlikeErr) {
                                        done(unlikeErr);
                                    }
                                });
                        });
                });
        });
    });

    it('should receive unread notifications count via WebSocket after receiving a reply to a comment', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 标记是否已经接收到第一个未读通知数消息
        let firstUnreadMessageReceived = false;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (!firstUnreadMessageReceived) {
                    firstUnreadMessageReceived = true;
                    return;
                }

                // 对推送的消息进行断言
                chai.expect(message).to.deep.equal({
                    type: 2,
                    data: {
                        count: 1,
                    },
                });

                done();
            });

            // 在连接成功后，调用评论帖子的接口
            chai.request(app)
                .post(`/posts/${postId}/comment`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: '这是一条评论',
                })
                .end((commentErr, commentRes) => {
                    if (commentErr) {
                        done(commentErr);
                    }

                    const commentId = commentRes.body.commentId;

                    // 使用获取到的评论ID调用回复评论的接口
                    chai.request(app)
                        .post(`/posts/${postId}/comment`)
                        .set('Authorization', `Bearer ${otherToken}`)
                        .send({
                            content: '这是一条回复评论',
                            parentId: commentId, // 将评论的 ID 作为父级评论 ID
                        })
                        .end((replyErr) => {
                            if (replyErr) {
                                done(replyErr);
                            }
                        });
                });
        });
    });

    it('should receive unread notifications count via WebSocket after receiving a reply to a comment and deleting the reply', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 记录未读通知数推送次数
        let unreadCount = 0;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (unreadCount === 0) {
                    unreadCount++;
                    return;
                }

                // 根据推送的消息次数进行断言
                if (unreadCount === 1 && message.type === 2 && message.data.count === 1) {
                    unreadCount++;
                } else if (unreadCount === 2 && message.type === 2  && message.data.count === 0) {
                    done();
                } else {
                    done(new Error('Unexpected unread notifications count or message count'));
                }
            });

            // 在连接成功后，调用评论帖子的接口
            chai.request(app)
                .post(`/posts/${postId}/comment`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: '这是一条评论',
                })
                .end((commentErr, commentRes) => {
                    if (commentErr) {
                        done(commentErr);
                    }

                    const commentId = commentRes.body.commentId;

                    // 使用获取到的评论ID调用回复评论的接口
                    chai.request(app)
                        .post(`/posts/${postId}/comment`)
                        .set('Authorization', `Bearer ${otherToken}`)
                        .send({
                            content: '这是一条回复评论',
                            parentId: commentId, // 将评论的 ID 作为父级评论 ID
                        })
                        .end((replyErr, replyRes) => {
                            if (replyErr) {
                                done(replyErr);
                            }

                            const replyId = replyRes.body.commentId;

                            // 使用获取到的回复评论的 ID 调用删除回复评论的接口
                            chai.request(app)
                                .delete(`/comments/${replyId}`)
                                .set('Authorization', `Bearer ${otherToken}`)
                                .end((deleteErr) => {
                                    if (deleteErr) {
                                        done(deleteErr);
                                    }
                                });
                        });
                });
        });
    });

    it('should receive unread notifications count via WebSocket after following and unfollowing a user', (done) => {
        // 创建带有认证信息的 WebSocket 连接
        const socket = ioClient(`http://localhost:${config.port}`, {
            auth: {
                token: token,
            },
        });

        // 记录未读通知数推送次数
        let unreadCount = 0;

        // 监听连接成功事件
        socket.on('connect', () => {
            // 监听 WebSocket 推送消息
            socket.on('notifications', (message) => {
                // 只处理未读通知数消息
                if (message.type !== 2) {
                    return;
                }

                // 忽略第一个消息
                if (unreadCount === 0) {
                    unreadCount++;
                    return;
                }

                // 根据推送的消息次数进行断言
                if (unreadCount === 1 && message.type === 2 && message.data.count === 1) {
                    unreadCount++;
                } else if (unreadCount === 2 && message.type === 2 && message.data.count === 0) {
                    done();
                } else {
                    done(new Error('Unexpected unread notifications count or message count'));
                }
            });

            // 在连接成功后，调用关注用户的接口
            chai.request(app)
                .post(`/users/${user.id}/follow?action=1`)
                .set('Authorization', `Bearer ${otherToken}`)
                .end((followErr) => {
                    if (followErr) {
                        done(followErr);
                    }

                    // 调用取消关注用户的接口
                    chai.request(app)
                        .post(`/users/${user.id}/follow?action=0`)
                        .set('Authorization', `Bearer ${otherToken}`)
                        .end((unfollowErr) => {
                            if (unfollowErr) {
                                done(unfollowErr);
                            }
                        });
                });
        });
    });

    afterEach(async () => {
        // 关闭 WebSocket 连接
        if (socket.connected) {
            socket.disconnect();
        }

        try {
            // 删除测试用户和附近的用户
            await User.deleteOne({ mobile: mobile });

            const promises = nearbyUsers.map((userInfo) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        await User.deleteOne({ _id: userInfo.userId });
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            await Promise.all(promises);
        } catch (err) {
            throw err;
        }
    });
});
