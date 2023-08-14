const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, before, beforeEach, describe } = require("mocha");
const app = require("../../app");
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("Comments API", () => {
  let token;
  let otherUserToken;
  let mobile;
  let postId;

  beforeEach(async () => {
    // 生成随机的手机号
    mobile = generateMobile();

    // 注册用户并获取token
    const registerResponse = await chai
      .request(app)
      .post("/users/register")
      .send({
        mobile: mobile,
        gender: "male",
        birthday: "2023-07-30",
        avatar: "avatar.png",
      });

    token = registerResponse.body.token;

    // 创建一个测试帖子
    const createPostResponse = await chai
      .request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        content: "Test post",
        city: "北京",
        longitude: "116.4074",
        latitude: "39.9042",
        images: ["/uploads/xxx1.png", "/uploads/xxx2.png"],
        visibility: 0,
      });

    postId = createPostResponse.body.postId;
  });

  describe("POST /posts/{postId}/comment", () => {
    it("should create a new comment for a post", (done) => {
      const commentContent = "This is a test comment";

      chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: commentContent,
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("commentId");
          done();
        });
    });

    it("should create a new reply to a comment", async () => {
      // 创建一个测试评论
      const createCommentResponse = await chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Test comment",
        });

      const commentId = createCommentResponse.body.commentId;
      const replyContent = "This is a test reply";

      const res = await chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: replyContent,
          parentId: commentId,
        });

      res.should.have.status(200);
      res.body.should.have.property("commentId");
    });
  });

  describe("DELETE /comments/{commentId}", () => {
    let commentId;

    beforeEach(async () => {
      // 创建一个测试评论
      const createCommentResponse = await chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Test comment",
        });

      commentId = createCommentResponse.body.commentId;
    });

    it("should delete a comment", (done) => {
      chai
        .request(app)
        .delete(`/comments/${commentId}`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should return 404 if comment does not exist", (done) => {
      const nonExistentCommentId = "non-existent-comment-id";

      chai
        .request(app)
        .delete(`/comments/${nonExistentCommentId}`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should return 404 if user is not the author of the comment", (done) => {
      // 创建另一个用户并获取其令牌
      const otherUserMobile = generateMobile();
      const newUser = {
        mobile: otherUserMobile,
        gender: "male",
        birthday: "2000-01-01",
        avatar: "/uploads/avatar.png",
        longitude: "116.4074",
        latitude: "39.9042",
      };

      chai
        .request(app)
        .post("/users/register")
        .send(newUser)
        .end((err, res) => {
          res.should.have.status(200);
          otherUserToken = res.body.token;

          // 使用其他用户的令牌删除评论
          chai
            .request(app)
            .delete(`/comments/${commentId}`)
            .set("Authorization", `Bearer ${otherUserToken}`)
            .end((err, res) => {
              res.should.have.status(404);
              done();
            });
        });
    });
  });

  describe("POST /comments/{commentId}/like", () => {
    // 在测试之前创建一个评论
    let commentId;
    let commentToken;

    before(async () => {
      // 创建一个测试评论
      const createCommentResponse = await chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Test comment",
        });

      commentId = createCommentResponse.body.commentId;
      commentToken = token;
    });

    it("should like a comment", (done) => {
      chai
        .request(app)
        .post(`/comments/${commentId}/like`)
        .set("Authorization", `Bearer ${commentToken}`)
        .send({
          operation: 1, // 1 表示点赞
        })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should unlike a comment", (done) => {
      chai
        .request(app)
        .post(`/comments/${commentId}/like`)
        .set("Authorization", `Bearer ${commentToken}`)
        .send({
          operation: 0, // 0 表示取消点赞
        })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("GET /comments/{commentId}/replies", () => {
    let commentId;

    beforeEach(async () => {
      // 创建一个测试评论
      const createCommentResponse = await chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Test comment",
        });

      commentId = createCommentResponse.body.commentId;
    });

    it("should return an array of comment replies", (done) => {
      chai
        .request(app)
        .get(`/comments/${commentId}/replies`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");
          done();
        });
    });

    it("should return 404 if comment does not exist", (done) => {
      const invalidCommentId = "invalid-comment-id";

      chai
        .request(app)
        .get(`/comments/${invalidCommentId}/replies`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });

  describe("GET /posts/{postId}/comments", () => {
    it("should return an array of post comments", (done) => {
      chai
        .request(app)
        .get(`/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");
          done();
        });
    });

    it("should return 404 if post does not exist", (done) => {
      const invalidPostId = "invalid-post-id";

      chai
        .request(app)
        .get(`/posts/${invalidPostId}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });
});
