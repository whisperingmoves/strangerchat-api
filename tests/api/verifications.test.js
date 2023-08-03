const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, beforeEach, describe} = require('mocha');
const app = require('../../app');

chai.use(chaiHttp);
chai.should();

describe('Verifications API', () => {

    describe('POST /verifications/sendCode', () => {
        let mobile;

        beforeEach(() => {
            mobile = '135' + Math.floor(Math.random() * 1000000000);
        })

        it('should send code successfully', done => {
            chai.request(app)
                .post('/verifications/sendCode')
                .send({ mobile: mobile })
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                })
        })
    })

    describe('POST /verifications/verifyCode', () => {
        let mobile;

        beforeEach(() => {
            mobile = '135' + Math.floor(Math.random() * 1000000000);
        })

        let code;

        beforeEach(done => { // 在每个测试用例前发送验证码
            chai.request(app)
                .post('/verifications/sendCode')
                .send({ mobile: mobile })
                .end((err, res) => {
                    code = res.body.code;
                    done();
                })
        })

        it('should return user info when verified', done => {

            // 先调用注册接口,然后使用已注册的手机号测试

            chai.request(app)
                .post('/users/register')
                .send({
                    mobile: mobile,
                    gender: 'male',
                    birthday: "2023-07-30",
                    avatar: 'avatar.png',
                })
                .then(() => {

                    // 再使用已注册的手机号来测试验证接口

                    chai.request(app)
                        .post('/verifications/verifyCode')
                        .send({
                            mobile: mobile,
                            code: code
                        })
                        .then(res => {
                            res.should.have.status(200);

                            res.body.should.have.property('token');
                            res.body.should.have.property('userId');
                            res.body.should.have.property('gender');
                            res.body.should.have.property('birthday');
                            res.body.should.have.property('avatar');

                            res.body.token.should.be.a('string');
                            res.body.userId.should.be.a('string');
                            res.body.gender.should.be.a('string').to.be.oneOf(['male', 'female']);
                            res.body.birthday.should.be.a('string').to.match(/^\d{4}-\d{2}-\d{2}$/);
                            res.body.avatar.should.be.a('string');

                            // 验证可能不返回的字段
                            if (res.body.hasOwnProperty('checkedDays')) {
                                res.body.checkedDays.should.be.a('number').to.be.within(0, 7);
                            }
                            if (res.body.hasOwnProperty('lastCheckDate')) {
                                res.body.lastCheckDate.should.be.a('number');
                            }

                            // 验证其他可能不返回的字段
                            if (res.body.hasOwnProperty('giftsReceived')) {
                                res.body.giftsReceived.should.be.a('number');
                            }
                            if (res.body.hasOwnProperty('username')) {
                                res.body.username.should.be.a('string');
                            }
                            if (res.body.hasOwnProperty('city')) {
                                res.body.city.should.be.a('string');
                            }
                            if (res.body.hasOwnProperty('followingCount')) {
                                res.body.followingCount.should.be.a('number');
                            }
                            if (res.body.hasOwnProperty('followersCount')) {
                                res.body.followersCount.should.be.a('number');
                            }
                            if (res.body.hasOwnProperty('visitorsCount')) {
                                res.body.visitorsCount.should.be.a('number');
                            }
                            if (res.body.hasOwnProperty('freeHeatsLeft')) {
                                res.body.freeHeatsLeft.should.be.a('number');
                            }
                            if (res.body.hasOwnProperty('coinBalance')) {
                                res.body.coinBalance.should.be.a('number');
                            }

                            done();
                        })
                })
        });

        it('should return 201 when unregisted', done => {
            chai.request(app)
                .post('/verifications/verifyCode')
                .send({
                    mobile: mobile, // 使用未注册的手机号
                    code: code
                })
                .then(res => {
                    res.should.have.status(201);
                    done();
                })
        })

        it('should return 400 when code is wrong', done => {
            // 发送验证码,使用错误的code测试
            chai.request(app)
                .post('/verifications/verifyCode')
                .send({
                    mobile: mobile,
                    code: 'wrong-code'
                })
                .then(res => {
                    res.should.have.status(400);
                    res.body.should.have.property('message');
                    done();
                })
        })

    })

})
