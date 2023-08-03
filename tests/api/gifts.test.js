const chai = require('chai');
const chaiHttp = require('chai-http');
const { it, beforeEach, describe } = require('mocha');
const app = require('../../app');
const Gift = require('../../models/Gift');

chai.use(chaiHttp);
chai.should();

describe('Gifts API', () => {
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

    describe('GET /gifts', () => {
        beforeEach(async () => {
            // 每次测试前创建10个礼物
            for (let i = 0; i < 10; i++) {
                await Gift.create({
                    image: `/gifts/gift${i + 1}.png`,
                    name: `礼物${i + 1}`,
                    value: (i + 1) * 100,
                });
            }
        });

        afterEach(async () => {
            // 每次测试后删除所有礼物
            await Gift.deleteMany({});
        });

        it('should get gift list', done => {
            chai.request(app)
                .get('/gifts')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array').that.has.lengthOf(10);

                    res.body.forEach(gift => {
                        gift.should.have.property('id');
                        gift.should.have.property('image');
                        gift.should.have.property('name');
                        gift.should.have.property('value');

                        gift.id.should.be.a('string');
                        gift.image.should.be.a('string');
                        gift.name.should.be.a('string');
                        gift.value.should.be.a('number').that.is.within(100, 1000);
                    });

                    done();
                });
        });

        it('should return 401 if user is not authenticated', done => {
            chai.request(app)
                .get('/gifts')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
});