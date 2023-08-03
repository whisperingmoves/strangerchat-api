const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, beforeEach, describe} = require('mocha');
const app = require('../../app');
const CoinProduct = require('../../models/CoinProduct');

chai.use(chaiHttp);
chai.should();

describe('CoinProducts API', () => {
    let token;
    let mobile;
    let userId;

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

    describe('GET /products/coins', () => {
        beforeEach(async () => {
            // 每次测试前创建10个金币商品
            for (let i = 0; i < 10; i++) {
                await CoinProduct.create({
                    id: `coin${i + 1}`,
                    coins: (i + 1) * 100,
                    originalPrice: (i + 1) * 1000,
                    price: (i + 1) * 900,
                    currency: 'CNY',
                });
            }
        });

        it('should get coin product list', done => {
            chai.request(app)
                .get('/products/coins')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, pageSize: 10 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array').that.has.lengthOf(10);

                    res.body.forEach(product => {
                        product.should.have.property('id');
                        product.should.have.property('coins');
                        product.should.have.property('originalPrice');
                        product.should.have.property('price');
                        product.should.have.property('currency');

                        product.id.should.be.a('string');
                        product.coins.should.be.a('number').that.is.within(100, 10000);
                        product.originalPrice.should.be.a('number').that.is.within(1000, 1000000);
                        product.price.should.be.a('number').that.is.within(900, 9000);
                        product.currency.should.be.a('string').that.matches(/^[A-Z]{3}$/);
                    });

                    done();
                });
        });

        it('should return 401 if user is not authenticated', done => {
            chai.request(app)
                .get('/products/coins')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
});
