const chai = require('chai');
const chaiHttp = require('chai-http');
const {beforeEach, describe } = require('mocha');
const app = require('../../app');

chai.use(chaiHttp);
chai.should();

describe('Notifications API', () => {
    let token;
    let mobile;

    beforeEach(async () => {
        // 生成随机的手机号
        mobile = '135' + Math.floor(Math.random() * 1000000000);

        // 注册用户并获取token
        const registerResponse = await chai.request(app)
            .post('/users/register')
            .send({
                mobile: mobile,
                gender: 'male',
                birthday: "2023-07-30",
                avatar: 'avatar.png',
            });

        token = registerResponse.body.token;
    });

    describe('GET /notifications/interaction', () => {
        it('should get like notifications list', done => {
            chai.request(app)
                .get('/notifications/interaction')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, pageSize: 10, interactionType: 0 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach(notification => {
                        notification.should.have.property('notificationId');
                        notification.should.have.property('userAvatar');
                        notification.should.have.property('userId');
                        notification.should.have.property('interactionType');
                        notification.should.have.property('interactionTime');
                        notification.should.have.property('postId');

                        if (notification.hasOwnProperty('userName')) {
                            notification.userName.should.be.a('string');
                        }

                        if (notification.hasOwnProperty('postImage')) {
                            notification.postImage.should.be.a('string');
                        }

                        notification.interactionType.should.equal(0);
                        notification.interactionTime.should.be.a('number');
                        notification.postId.should.should.be.a('string');
                        notification.readStatus.should.be.within(0, 1);
                    });

                    done();
                });
        });

        it('should get comment notifications list', done => {
            chai.request(app)
                .get('/notifications/interaction')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, pageSize: 10, interactionType: 1 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach(notification => {
                        notification.should.have.property('notificationId');
                        notification.should.have.property('userAvatar');
                        notification.should.have.property('userId');
                        notification.should.have.property('interactionType');
                        notification.should.have.property('interactionTime');
                        notification.should.have.property('postId');
                        notification.should.have.property('commentId');

                        if (notification.hasOwnProperty('userName')) {
                            notification.userName.should.be.a('string');
                        }

                        if (notification.hasOwnProperty('postImage')) {
                            notification.postImage.should.be.a('string');
                        }

                        notification.interactionType.should.equal(1);
                        notification.interactionTime.should.be.a('number');
                        notification.postId.should.should.be.a('string');
                        notification.readStatus.should.be.within(0, 1);
                    });

                    done();
                });
        });

        it('should get share notifications list', done => {
            chai.request(app)
                .get('/notifications/interaction')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, pageSize: 10, interactionType: 2 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach(notification => {
                        notification.should.have.property('notificationId');
                        notification.should.have.property('userAvatar');
                        notification.should.have.property('userId');
                        notification.should.have.property('interactionType');
                        notification.should.have.property('interactionTime');
                        notification.should.have.property('postId');

                        if (notification.hasOwnProperty('userName')) {
                            notification.userName.should.be.a('string');
                        }

                        if (notification.hasOwnProperty('postImage')) {
                            notification.postImage.should.be.a('string');
                        }

                        notification.interactionType.should.equal(2);
                        notification.interactionTime.should.be.a('number');
                        notification.postId.should.should.be.a('string');
                        notification.readStatus.should.be.within(0, 1);
                    });

                    done();
                });
        });

        it('should get collect notifications list', done => {
            chai.request(app)
                .get('/notifications/interaction')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, pageSize: 10, interactionType: 3 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach(notification => {
                        notification.should.have.property('notificationId');
                        notification.should.have.property('userAvatar');
                        notification.should.have.property('userId');
                        notification.should.have.property('interactionType');
                        notification.should.have.property('interactionTime');
                        notification.should.have.property('postId');

                        if (notification.hasOwnProperty('userName')) {
                            notification.userName.should.be.a('string');
                        }

                        if (notification.hasOwnProperty('postImage')) {
                            notification.postImage.should.be.a('string');
                        }

                        notification.interactionType.should.equal(3);
                        notification.interactionTime.should.be.a('number');
                        notification.postId.should.should.be.a('string');
                        notification.readStatus.should.be.within(0, 1);
                    });

                    done();
                });
        });

        it('should get comment like notifications list', done => {
            chai.request(app)
                .get('/notifications/interaction')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, pageSize: 10, interactionType: 4 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach(notification => {
                        notification.should.have.property('notificationId');
                        notification.should.have.property('userAvatar');
                        notification.should.have.property('userId');
                        notification.should.have.property('interactionType');
                        notification.should.have.property('interactionTime');
                        notification.should.have.property('postId');
                        notification.should.have.property('commentId');

                        if (notification.hasOwnProperty('userName')) {
                            notification.userName.should.be.a('string');
                        }

                        if (notification.hasOwnProperty('postImage')) {
                            notification.postImage.should.be.a('string');
                        }

                        notification.interactionType.should.equal(4);
                        notification.interactionTime.should.be.a('number');
                        notification.postId.should.should.be.a('string');
                        notification.readStatus.should.be.within(0, 1);
                    });

                    done();
                });
        });

        it('should get comment reply notifications list', done => {
            chai.request(app)
                .get('/notifications/interaction')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, pageSize: 10, interactionType: 5 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach(notification => {
                        notification.should.have.property('notificationId');
                        notification.should.have.property('userAvatar');
                        notification.should.have.property('userId');
                        notification.should.have.property('interactionType');
                        notification.should.have.property('interactionTime');
                        notification.should.have.property('postId');
                        notification.should.have.property('commentId');

                        if (notification.hasOwnProperty('userName')) {
                            notification.userName.should.be.a('string');
                        }

                        if (notification.hasOwnProperty('postImage')) {
                            notification.postImage.should.be.a('string');
                        }

                        notification.interactionType.should.equal(5);
                        notification.interactionTime.should.be.a('number');
                        notification.postId.should.should.be.a('string');
                        notification.readStatus.should.be.within(0, 1);
                    });

                    done();
                });
        });

        it('should return 401 if user is not authenticated', done => {
            chai.request(app)
                .get('/notifications/interaction')
                .query({ page: 1, pageSize: 10 })
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
});
