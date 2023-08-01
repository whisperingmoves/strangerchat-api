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

    describe('POST /posts/:postId/collect', () => {
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

        it('should add collect when operation is 1', done => {
            chai.request(app)
                .post(`/posts/${postId}/collect`)
                .set('Authorization', `Bearer ${token}`)
                .send({ operation: 1 })
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should remove collect when operation is 0', done => {
            // 首先收藏帖子
            chai.request(app)
                .post(`/posts/${postId}/collect`)
                .set('Authorization', `Bearer ${token}`)
                .send({ operation: 1 })
                .end(() => {
                    // 然后取消收藏
                    chai.request(app)
                        .post(`/posts/${postId}/collect`)
                        .set('Authorization', `Bearer ${token}`)
                        .send({ operation: 0 })
                        .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
        });

        it('should return an error when trying to remove collect from a post not collected', done => {
            chai.request(app)
                .post(`/posts/${postId}/collect`)
                .set('Authorization', `Bearer ${token}`)
                .send({ operation: 0 })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').equal('帖子未被收藏，无法取消收藏');
                    done();
                });
        });
    });

    describe('POST /posts/:postId/share', () => {
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

        it('should share a post to a valid platform', done => {
            chai.request(app)
                .post(`/posts/${postId}/share`)
                .set('Authorization', `Bearer ${token}`)
                .send({ sharePlatform: 1 })
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should return an error when sharing a post to an invalid platform', done => {
            chai.request(app)
                .post(`/posts/${postId}/share`)
                .set('Authorization', `Bearer ${token}`)
                .send({ sharePlatform: 4 })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').equal('无效的分享平台');
                    done();
                });
        });
    });

    describe('GET /posts/:postId', () => {
        let postId;

        before(async () => {
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

        it('should get post details', done => {
            chai.request(app)
                .get(`/posts/${postId}`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('authorId');
                    res.body.should.have.property('authorAvatar');
                    res.body.should.have.property('createTime');
                    res.body.should.have.property('content');
                    res.body.should.have.property('postId');
                    res.body.should.have.property('likeCount');
                    res.body.should.have.property('commentCount');
                    res.body.should.have.property('shareCount');
                    res.body.should.have.property('isLiked');
                    res.body.should.have.property('isCollected');

                    // 验证可能不会返回的非必填字段
                    if (res.body.hasOwnProperty('authorName')) {
                        res.body.authorName.should.be.a('string');
                    }
                    if (res.body.hasOwnProperty('isFollowed')) {
                        res.body.isFollowed.should.be.a('number');
                    }
                    if (res.body.hasOwnProperty('images')) {
                        res.body.images.should.be.an('array');
                    }
                    if (res.body.hasOwnProperty('city')) {
                        res.body.city.should.be.a('string');
                    }

                    done();
                });
        });

        it('should return 404 if post does not exist', done => {
            chai.request(app)
                .get(`/posts/nonExistentPostId`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });

        it('should return 404 if postId is invalid', done => {
            chai.request(app)
                .get('/posts/invalidPostId')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });

        it('should return 401 if user is not authenticated', done => {
            chai.request(app)
                .get(`/posts/${postId}`)
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });

    describe('GET /posts/hot', () => {
        it('should get hot posts list', done => {
            chai.request(app)
                .get('/posts/hot')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    res.body.should.have.lengthOf.at.most(7);

                    res.body.forEach(post => {
                        post.should.have.property('postId');
                        post.should.have.property('userId');
                        post.should.have.property('content');
                        post.should.have.property('hotIndex');

                        if (post.hasOwnProperty('username')) {
                            post.username.should.be.a('string');
                        }
                    });

                    done();
                });
        });

        it('should return 401 if user is not authenticated', done => {
            chai.request(app)
                .get('/posts/hot')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
});
