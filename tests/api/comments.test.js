const chai = require('chai');
const chaiHttp = require('chai-http');
const {it, beforeEach, describe} = require('mocha');
const app = require('../../app');

chai.use(chaiHttp);
chai.should();

describe('Comments API', () => {
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

    describe('POST /posts/{postId}/comment', () => {
        let postId;

        beforeEach(async () => {
            // 创建一个测试帖子
            const createPostResponse = await chai.request(app)
                .post('/posts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'Test post',
                    city: '北京',
                    longitude: '116.4074',
                    latitude: '39.9042',
                    images: [
                        "/uploads/xxx1.png",
                        "/uploads/xxx2.png"
                    ],
                    visibility: 0,
                    atUsers: ["user1", "user2"]
                });

            postId = createPostResponse.body.postId;
        });

        it('should create a new comment for a post', done => {
            const commentContent = 'This is a test comment';

            chai.request(app)
                .post(`/posts/${postId}/comment`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: commentContent
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('commentId');
                    done();
                });
        });

        it('should create a new reply to a comment', async () => {
            // 创建一个测试评论
            const createCommentResponse = await chai.request(app)
                .post(`/posts/${postId}/comment`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'Test comment'
                });

            const commentId = createCommentResponse.body.commentId;
            const replyContent = 'This is a test reply';

            const res = await chai.request(app)
                .post(`/posts/${postId}/comment`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: replyContent,
                    parentId: commentId
                });

            res.should.have.status(200);
            res.body.should.have.property('commentId');
        });
    });
});
