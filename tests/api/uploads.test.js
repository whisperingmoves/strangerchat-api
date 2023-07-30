const chai = require('chai');
const chaiHttp = require('chai-http');
const FormData = require('form-data');
const {it, after, describe} = require('mocha');
const app = require('../../app');
const fs = require("fs");

chai.use(chaiHttp);
chai.should();

describe('Uploads API', () => {

    describe('POST /uploadAvatar', () => {
        // after(done => {
        //     fs.unlink('test.png', done);
        // })

        it('should upload avatar successfully', done => {

            const form = new FormData();
            const readStream = fs.createReadStream('test.png');

            form.append('avatar', readStream);

            chai.request(app)
                .post('/uploadAvatar')
                .send(form)
                .then(res => {
                res.should.have.status(200);

                res.body.should.have.property('url');

                done();
            })
        })

        it('should return 400 if avatar is invalid', done => {

            chai.request(app)
                .post('/uploadAvatar')
                .send({
                    // 无效的头像字段
                })
                .then(res  => {
                    res.should.have.status(400);

                    res.body.should.have.property('message');

                    done();
                })
        })
    })

})
