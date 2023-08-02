const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, beforeEach, describe} = require('mocha');
const app = require('../../app');
const User = require('../../models/User');

chai.use(chaiHttp);
chai.should();

describe('Users API', () => {
    let token;
    let userId;

    beforeEach(async () => {
        // 生成随机的手机号
        const mobile = '135' + Math.floor(Math.random() * 1000000000);

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

    describe('POST /users/register', () => {

        let mobile;

        beforeEach(() => {
            mobile = '135' + Math.floor(Math.random() * 1000000000);
        })

        it('should register successfully', done => {
            chai.request(app)
                .post('/users/register')
                .send({
                    // 发送要求的字段
                    mobile,
                    gender: 'male', // 性别
                    birthday: '1990-01-01', //生日
                    avatar: 'xxxx.jpg', // 头像链接
                    longitude: '116.403896', // 经度
                    latitude: '39.914772' // 纬度
                })
                .then(res => {

                    res.should.have.status(200);

                    res.body.should.have.property('token');
                    res.body.should.have.property('userId');

                    done();
                })
        });

        it('should return 400 if missing fields', done => {

            chai.request(app)
                .post('/users/register')
                .send({
                    //缺少字段
                    gender: 'male',
                    birthday: '1990-01-01'
                })
                .then(res => {
                    res.should.have.status(400);

                    res.body.should.have.property('message');

                    done();
                })
        });

    })

    describe('POST /users/:userId/follow', () => {
        let followedUserId;

        beforeEach(async () => {
            // 创建一个测试用户
            const createUserResponse = await chai.request(app)
                .post('/users/register')
                .send({
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'male',
                    birthday: "2023-07-30",
                    avatar: 'avatar.png',
                });

            followedUserId = createUserResponse.body.userId;
        });

        it('should follow user when action is 1', done => {
            chai.request(app)
                .post(`/users/${followedUserId}/follow?action=1`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should unfollow user when action is 0', done => {
            // 首先关注用户
            chai.request(app)
                .post(`/users/${followedUserId}/follow?action=1`)
                .set('Authorization', `Bearer ${token}`)
                .end(() => {
                    // 然后取消关注
                    chai.request(app)
                        .post(`/users/${followedUserId}/follow?action=0`)
                        .set('Authorization', `Bearer ${token}`)
                        .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
        });

        it('should return an error when trying to unfollow a user not followed', done => {
            chai.request(app)
                .post(`/users/${followedUserId}/follow?action=0`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').equal('用户未被关注，无法取消关注');
                    done();
                });
        });
    });

    describe('GET /users/following', () => {
        let userId1;
        let userId2;
        let token1;
        let token2;

        beforeEach(async () => {
            // 创建一个用户名含有"张"的测试用户
            const res1 = await chai.request(app)
                .post('/users/register')
                .send({
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'male',
                    birthday: "2023-07-30",
                    avatar: 'avatar.png',
                });

            // 保存用户1的userId和token
            userId1 = res1.body.userId;
            token1 = res1.body.token;

            // 创建另一个测试用户
            const res2 = await chai.request(app)
                .post('/users/register')
                .send({
                    mobile: '136' + Math.floor(Math.random() * 1000000000),
                    gender: 'female',
                    birthday: "2023-07-30",
                    avatar: 'avatar.png',
                });

            // 保存用户2的userId和token
            userId2 = res2.body.userId;
            token2 = res2.body.token;

            // 设置用户名
            const user1 = await User.findById(userId1);
            user1.username = '张三';
            await user1.save();

            const user2 = await User.findById(userId2);
            user2.username = '李四';
            await user2.save();

            // 让两个测试用户各发表一篇帖子
            await chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    content: '这是张三发表的一篇帖子',
                    city: '北京',
                    longitude: '116.4074',
                    latitude: '39.9042'
                });

            await chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token2}`)
                .send({
                    content: '这是李四发表的一篇帖子',
                    city: '上海',
                    longitude: '121.4737',
                    latitude: '31.2304'
                });

            // 关注两个测试用户
            await chai.request(app)
                .post(`/users/${userId1}/follow?action=1`)
                .set('Authorization', `Bearer ${token}`);

            await chai.request(app)
                .post(`/users/${userId2}/follow?action=1`)
                .set('Authorization', `Bearer ${token}`);
        });

        it('should return an array of following users', (done) => {
            chai.request(app)
                .get('/users/following')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach((user) => {
                        user.should.have.property('userId').that.is.a('string');
                        user.should.have.property('userAvatar').that.is.a('string').with.length.greaterThan(0);
                        user.should.have.property('username').that.is.a('string');
                        user.should.have.property('latestPostContent').that.is.a('string');
                    });

                    done();
                });
        });

        it('should return a limited number of following users', (done) => {
            chai.request(app)
                .get('/users/following?page=1&pageSize=2')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array').with.lengthOf(2);

                    res.body.forEach((user) => {
                        user.should.have.property('userId').that.is.a('string');
                        user.should.have.property('userAvatar').that.is.a('string').with.length.greaterThan(0);
                        user.should.have.property('username').that.is.a('string');
                        user.should.have.property('latestPostContent').that.is.a('string');
                    });

                    done();
                });
        });

        it('should return following users whose username matches the keyword', (done) => {
            chai.request(app)
                .get('/users/following?keyword=' + encodeURI('张'))
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach((user) => {
                        user.should.have.property('userId').that.is.a('string');
                        user.should.have.property('userAvatar').that.is.a('string').with.length.greaterThan(0);
                        user.should.have.property('username').that.is.a('string').that.includes('张');
                        user.should.have.property('latestPostContent').that.is.a('string');
                    });

                    done();
                });
        });
    });

    describe('GET /users/followers', () => {
        let userId1;
        let userId2;
        let token1;
        let token2;

        beforeEach(async () => {
            // 创建一个测试用户
            const res1 = await chai.request(app)
                .post('/users/register')
                .send({
                    mobile: '135' + Math.floor(Math.random() * 1000000000),
                    gender: 'male',
                    birthday: "2023-07-30",
                    avatar: 'avatar.png',
                });

            // 保存用户1的userId和token
            userId1 = res1.body.userId;
            token1 = res1.body.token;

            // 创建另一个测试用户
            const res2 = await chai.request(app)
                .post('/users/register')
                .send({
                    mobile: '136' + Math.floor(Math.random() * 1000000000),
                    gender: 'female',
                    birthday: "2023-07-30",
                    avatar: 'avatar.png',
                });

            // 保存用户2的userId和token
            userId2 = res2.body.userId;
            token2 = res2.body.token;

            // 设置用户名
            const user1 = await User.findById(userId1);
            user1.username = '张三';
            await user1.save();

            const user2 = await User.findById(userId2);
            user2.username = '李四';
            await user2.save();

            // 让两个测试用户各发表一篇帖子
            await chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    content: '这是张三发表的一篇帖子',
                    city: '北京',
                    longitude: '116.4074',
                    latitude: '39.9042'
                });

            await chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token2}`)
                .send({
                    content: '这是李四发表的一篇帖子',
                    city: '上海',
                    longitude: '121.4737',
                    latitude: '31.2304'
                });

            // 让两个测试用户关注我
            await chai.request(app)
                .post(`/users/${userId}/follow?action=1`)
                .set('Authorization', `Bearer ${token1}`);

            await chai.request(app)
                .post(`/users/${userId}/follow?action=1`)
                .set('Authorization', `Bearer ${token2}`);
        });

        it('should return an array of followers', (done) => {
            chai.request(app)
                .get('/users/followers')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach((user) => {
                        user.should.have.property('userId').that.is.a('string');
                        user.should.have.property('userAvatar').that.is.a('string').with.length.greaterThan(0);
                        user.should.have.property('username').that.is.a('string');
                        user.should.have.property('latestPostContent').that.is.a('string');
                    });

                    done();
                });
        });

        it('should return a limited number of followers', (done) => {
            chai.request(app)
                .get('/users/followers?page=1&pageSize=1')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array').with.lengthOf(1);

                    res.body.forEach((user) => {
                        user.should.have.property('userId').that.is.a('string');
                        user.should.have.property('userAvatar').that.is.a('string').with.length.greaterThan(0);
                        user.should.have.property('username').that.is.a('string');
                        user.should.have.property('latestPostContent').that.is.a('string');
                    });

                    done();
                });
        });

        it('should return followers whose username matches the keyword', (done) => {
            chai.request(app)
                .get('/users/followers?keyword=' + encodeURI('张'))
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');

                    res.body.forEach((user) => {
                        user.should.have.property('userId').that.is.a('string');
                        user.should.have.property('userAvatar').that.is.a('string').with.length.greaterThan(0);
                        user.should.have.property('username').that.is.a('string').that.includes('张');
                        user.should.have.property('latestPostContent').that.is.a('string');
                    });

                    done();
                });
        });
    });
})
