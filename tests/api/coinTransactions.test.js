const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, beforeEach, describe} = require('mocha');
const app = require('../../app');
const CoinTransaction = require('../../models/CoinTransaction');
const moment = require("moment");

chai.use(chaiHttp);
chai.should();

describe('CoinTransactions API', () => {
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

    describe('GET /transactions/coins', () => {
        beforeEach(async () => {
            // 创建三条交易记录，分别在 2022-01-01、2022-01-02 和 2022-01-03 创建
            await CoinTransaction.create([
                {
                    userId,
                    coins: 100,
                    currency: 'CNY',
                    paymentMethod: '支付宝',
                    transactionId: Math.random().toString(36).substr(2, 10),
                    amount: 100,
                    createdAt: moment('2022-01-01T12:00:00Z').toDate(),
                },
                {
                    userId,
                    coins: 100,
                    currency: 'USD',
                    paymentMethod: '支付宝',
                    transactionId: Math.random().toString(36).substr(2, 10),
                    amount: 10,
                    createdAt: moment('2022-01-02T12:00:00Z').toDate(),
                },
                {
                    userId,
                    coins: 100,
                    currency: 'EUR',
                    paymentMethod: '支付宝',
                    transactionId: Math.random().toString(36).substr(2, 10),
                    amount: 5,
                    createdAt: moment('2022-01-03T12:00:00Z').toDate(),
                },
            ]);
        });

        it('should return all coin transactions if date is not specified', async () => {
            const res = await chai.request(app)
                .get('/transactions/coins')
                .set('Authorization', `Bearer ${token}`);

            res.should.have.status(200);
            res.body.should.be.an('array').that.has.lengthOf(3);

            res.body[0].should.have.property('currency').that.equals('EUR');
            res.body[0].should.have.property('amount').that.equals(5);

            res.body[1].should.have.property('currency').that.equals('USD');
            res.body[1].should.have.property('amount').that.equals(10);

            res.body[2].should.have.property('currency').that.equals('CNY');
            res.body[2].should.have.property('amount').that.equals(100);
        });

        it('should return coin transactions of the specified date', async () => {
            const res = await chai.request(app)
                .get('/transactions/coins')
                .query({ date: '2022-01-02' })
                .set('Authorization', `Bearer ${token}`);

            res.should.have.status(200);
            res.body.should.be.an('array').that.has.lengthOf(1);

            res.body[0].should.have.property('currency').that.equals('USD');
            res.body[0].should.have.property('amount').that.equals(10);
        });

        it('should return an empty array if there is no coin transaction on the specified date', async () => {
            const res = await chai.request(app)
                .get('/transactions/coins')
                .query({ date: '2022-01-04' })
                .set('Authorization', `Bearer ${token}`);

            res.should.have.status(200);
            res.body.should.be.an('array').that.is.empty;
        });

        it('should return 401 if user is not authenticated', async () => {
            const res = await chai.request(app)
                .get('/transactions/coins');

            res.should.have.status(401);
        });
    });
});
