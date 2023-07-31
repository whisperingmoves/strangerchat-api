const chai = require('chai');
const chaiHttp = require('chai-http');
const { it, beforeEach, describe } = require('mocha');
const app = require('../../app');

chai.use(chaiHttp);
chai.should();

describe('Posts API', () => {
    let token;
    let userId;
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
        userId = registerResponse.body.userId;
    });

    describe('POST /posts', () => {
        it('should create a new post', done => {
            const content = 'This is a test post';

            chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: content,
                    city: '北京',
                    longitude: '116.4074',
                    latitude: '39.9042',
                    images: [
                        "/uploads/xxx1.png",
                        "/uploads/xxx2.png"
                    ],
                    visibility: 0,
                    atUsers: ["user1", "user2"]
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('postId');
                    done();
                });
        });
    });

    describe('POST /posts/:postId/heat', () => {
        let postId;

        beforeEach(async () => {
            // 创建一个测试帖子
            const createPostResponse = await chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'Test post',
                    city: '北京',
                    longitude: '116.4074',
                    latitude: '39.9042',
                    images: [
                        "/uploads/xxx1.png",
                        "/uploads/xxx2.png"
                    ],
                    visibility: 0,
                    atUsers: ["user1", "user2"]
                });

            postId = createPostResponse.body.postId;
        });

        it('should increment heat count when action is 1', done => {
            chai.request(app)
                .post(`/posts/${postId}/heat?action=1`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should decrement heat count when action is 0', done => {
            // 首先增加帖子的加热次数
            chai.request(app)
                .post(`/posts/${postId}/heat?action=1`)
                .set('Authorization', `Bearer ${token}`)
                .end(() => {
                    // 然后减少帖子的加热次数
                    chai.request(app)
                        .post(`/posts/${postId}/heat?action=0`)
                        .set('Authorization', `Bearer ${token}`)
                        .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
        });

        it('should return an error when trying to decrement heat count below 0', done => {
            chai.request(app)
                .post(`/posts/${postId}/heat?action=0`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').equal('帖子未被加热，无法取消加热');
                    done();
                });
        });
    });

    describe('POST /posts/:postId/like', () => {
        let postId;

        beforeEach(async () => {
            // 创建一个测试帖子
            const createPostResponse = await chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'Test post',
                    city: '北京',
                    longitude: '116.4074',
                    latitude: '39.9042',
                    images: [
                        "/uploads/xxx1.png",
                        "/uploads/xxx2.png"
                    ],
                    visibility: 0,
                    atUsers: ["user1", "user2"]
                });

            postId = createPostResponse.body.postId;
        });

        it('should add like when action is 1', done => {
            chai.request(app)
                .post(`/posts/${postId}/like?action=1`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should remove like when action is 0', done => {
            // 首先给帖子点赞
            chai.request(app)
                .post(`/posts/${postId}/like?action=1`)
                .set('Authorization', `Bearer ${token}`)
                .end(() => {
                    // 然后取消点赞
                    chai.request(app)
                        .post(`/posts/${postId}/like?action=0`)
                        .set('Authorization', `Bearer ${token}`)
                        .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
        });

        it('should return an error when trying to remove like from a post not liked', done => {
            chai.request(app)
                .post(`/posts/${postId}/like?action=0`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').equal('帖子未被点赞，无法取消点赞');
                    done();
                });
        });
    });
});
