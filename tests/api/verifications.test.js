const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, before, beforeEach, describe} = require('mocha');
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
                .then(res => {

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

                            res.body.userId.should.be.a('string');

                            res.body.should.have.property('gender')
                                .and.to.be.oneOf(['male', 'female']);

                            // ... 其它用户信息的断言

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
