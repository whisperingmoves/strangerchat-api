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
});
