const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, beforeEach, describe} = require('mocha');
const app = require('../../app');

chai.use(chaiHttp);
chai.should();

describe('Users API', () => {
    let token;

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

})
