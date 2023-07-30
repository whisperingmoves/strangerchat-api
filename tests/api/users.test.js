const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, beforeEach, describe} = require('mocha');
const app = require('../../app');

chai.use(chaiHttp);
chai.should();

describe('Users API', () => {

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

})
