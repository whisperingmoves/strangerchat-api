// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, before, beforeEach, describe } = require("mocha");
const app = require("../../app");
const { generateMobile } = require("../helper");
const User = require("../../models/User");
const Post = require("../../models/Post");

chai.use(chaiHttp);
chai.should();

describe("Posts API", () => {
  let token;
  let mobile;
  let user;

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
    const userId = registerResponse.body.userId;

    user = await User.findById(userId);
  });

  describe("POST /posts", () => {
    it("should create a new post", (done) => {
      const content = "This is a test post";

      chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: content,
          city: "北京",
          longitude: "116.4074",
          latitude: "39.9042",
          images: ["/uploads/xxx1.png", "/uploads/xxx2.png"],
          visibility: 0,
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("postId");
          done();
        });
    });
  });

  describe("POST /posts/:postId/heat", () => {
    let postId;

    beforeEach(async () => {
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

    it("should increment heat count when action is 1", (done) => {
      chai
        .request(app)
        .post(`/posts/${postId}/heat?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should decrement heat count when action is 0", (done) => {
      // 首先增加帖子的加热次数
      chai
        .request(app)
        .post(`/posts/${postId}/heat?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end(() => {
          // 然后减少帖子的加热次数
          chai
            .request(app)
            .post(`/posts/${postId}/heat?action=0`)
            .set("Authorization", `Bearer ${token}`)
            .end((err, res) => {
              res.should.have.status(200);
              done();
            });
        });
    });

    it("should return an error when trying to decrement heat count below 0", (done) => {
      chai
        .request(app)
        .post(`/posts/${postId}/heat?action=0`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have
            .property("message")
            .equal("帖子未被加热，无法取消加热");
          done();
        });
    });
  });

  describe("POST /posts/:postId/like", () => {
    let postId;

    beforeEach(async () => {
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

    it("should add like when action is 1", (done) => {
      chai
        .request(app)
        .post(`/posts/${postId}/like?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should remove like when action is 0", (done) => {
      // 首先给帖子点赞
      chai
        .request(app)
        .post(`/posts/${postId}/like?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end(() => {
          // 然后取消点赞
          chai
            .request(app)
            .post(`/posts/${postId}/like?action=0`)
            .set("Authorization", `Bearer ${token}`)
            .end((err, res) => {
              res.should.have.status(200);
              done();
            });
        });
    });

    it("should return an error when trying to remove like from a post not liked", (done) => {
      chai
        .request(app)
        .post(`/posts/${postId}/like?action=0`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have
            .property("message")
            .equal("帖子未被点赞，无法取消点赞");
          done();
        });
    });
  });

  describe("POST /posts/:postId/collect", () => {
    let postId;

    beforeEach(async () => {
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

    it("should add collect when operation is 1", (done) => {
      chai
        .request(app)
        .post(`/posts/${postId}/collect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ operation: 1 })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should remove collect when operation is 0", (done) => {
      // 首先收藏帖子
      chai
        .request(app)
        .post(`/posts/${postId}/collect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ operation: 1 })
        .end(() => {
          // 然后取消收藏
          chai
            .request(app)
            .post(`/posts/${postId}/collect`)
            .set("Authorization", `Bearer ${token}`)
            .send({ operation: 0 })
            .end((err, res) => {
              res.should.have.status(200);
              done();
            });
        });
    });

    it("should return an error when trying to remove collect from a post not collected", (done) => {
      chai
        .request(app)
        .post(`/posts/${postId}/collect`)
        .set("Authorization", `Bearer ${token}`)
        .send({ operation: 0 })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have
            .property("message")
            .equal("帖子未被收藏，无法取消收藏");
          done();
        });
    });
  });

  describe("POST /posts/:postId/share", () => {
    let postId;

    beforeEach(async () => {
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

    it("should share a post to a valid platform", (done) => {
      chai
        .request(app)
        .post(`/posts/${postId}/share`)
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("GET /posts/:postId", () => {
    let postId;
    let atUser1;
    let atUser2;

    before(async () => {
      // 创建测试艾特用户
      atUser1 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
        username: "atUser1",
      });
      await atUser1.save();
      atUser2 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
        username: "atUser2",
      });
      await atUser2.save();

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
          atUsers: [atUser1.id, atUser2.id],
        });

      postId = createPostResponse.body.postId;
    });

    it("should get post details", (done) => {
      chai
        .request(app)
        .get(`/posts/${postId}`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("authorId");
          res.body.should.have.property("authorAvatar");
          res.body.should.have.property("authorGender");
          res.body.should.have.property("createTime");
          res.body.should.have.property("content");
          res.body.should.have.property("postId");
          res.body.should.have.property("likeCount");
          res.body.should.have.property("commentCount");
          res.body.should.have.property("shareCount");
          res.body.should.have.property("isLiked");
          res.body.should.have.property("isCollected");
          res.body.should.have.property("atUsers");

          // 验证可能不会返回的非必填字段
          if (res.body.hasOwnProperty("authorName")) {
            res.body.authorName.should.be.a("string");
          }
          if (res.body.hasOwnProperty("isFollowed")) {
            res.body.isFollowed.should.be.a("number");
          }
          if (res.body.hasOwnProperty("images")) {
            res.body.images.should.be.an("array");
          }
          if (res.body.hasOwnProperty("city")) {
            res.body.city.should.be.a("string");
          }
          if (res.body.hasOwnProperty("conversationId")) {
            res.body.conversationId.should.be.a("string");
          }

          res.body.atUsers.should.be.an("array").and.have.lengthOf(2);

          res.body.atUsers.forEach((user) => {
            user.should.have.property("id");
            user.should.have.property("username");

            user.id.should.be.a("string");
            user.username.should.be.a("string");
          });

          done();
        });
    });

    it("should return 404 if post does not exist", (done) => {
      chai
        .request(app)
        .get(`/posts/nonExistentPostId`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should return 404 if postId is invalid", (done) => {
      chai
        .request(app)
        .get("/posts/invalidPostId")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get(`/posts/${postId}`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /posts/hot", () => {
    it("should get hot posts list", (done) => {
      chai
        .request(app)
        .get("/posts/hot")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");
          res.body.should.have.lengthOf.at.most(7);

          res.body.forEach((post) => {
            post.should.have.property("postId");
            post.should.have.property("userId");
            post.should.have.property("content");
            post.should.have.property("hotIndex");

            if (post.hasOwnProperty("username")) {
              post.username.should.be.a("string");
            }
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/posts/hot")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /posts/latest", () => {
    beforeEach(async () => {
      // 创建并保存测试帖子
      const user1 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
      });
      const user2 = new User({
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "avatar2.jpg",
      });
      await user1.save();
      await user2.save();

      const post1 = new Post({
        content: "Test Post 1",
        author: user1._id,
        atUsers: [user2._id],
      });
      const post2 = new Post({
        content: "Test Post 2",
        author: user1._id,
        atUsers: [user2._id],
      });
      await post1.save();
      await post2.save();
    });

    it("should get latest posts list", (done) => {
      chai
        .request(app)
        .get("/posts/latest")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((post) => {
            post.should.have.property("authorId");
            post.should.have.property("authorAvatar");
            post.should.have.property("createTime");
            post.should.have.property("content");
            post.should.have.property("postId");

            if (post.hasOwnProperty("authorName")) {
              post.authorName.should.be.a("string");
            }

            post.createTime.should.be.a("number");
            post.images.should.be.an("array");
            post.content.should.be.a("string");
            post.likeCount.should.be.a("number");
            post.commentCount.should.be.a("number");
            post.shareCount.should.be.a("number");
            post.isLiked.should.be.within(0, 1);
            post.isFollowed.should.be.within(0, 1);
            post.isBlocked.should.be.within(0, 1);

            if (post.hasOwnProperty("conversationId")) {
              post.conversationId.should.be.a("string");
            }

            if (post.hasOwnProperty("atUsers")) {
              post.atUsers.should.be.an("array");

              post.atUsers.forEach((user) => {
                user.should.have.property("id");

                user.id.should.be.a("string");

                if (user.hasOwnProperty("username")) {
                  user.username.should.be.a("string");
                }
              });
            }
          });

          done();
        });
    });

    it("should get latest posts list with keyword", (done) => {
      const keyword = "T"; // 设置关键词

      chai
        .request(app)
        .get("/posts/latest")
        .set("Authorization", `Bearer ${token}`)
        .query({ keyword }) // 将关键词作为查询参数传递
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((post) => {
            // 验证帖子是否匹配关键词
            post.content.should.include(keyword);
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/posts/latest")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /posts/recommended", () => {
    let longitude;
    let latitude;
    let post1;
    let post2;

    beforeEach(async () => {
      // 创建并保存测试帖子
      const user1 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
      });
      const user2 = new User({
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "avatar2.jpg",
      });
      await user1.save();
      await user2.save();

      // 生成随机的经度和纬度
      longitude = 122.5 + Math.random() * 0.01;
      latitude = 31.2 + Math.random() * 0.01;

      post1 = new Post({
        content: "Test Post 1",
        author: user1._id,
        atUsers: [user2._id],
        location: {
          type: "Point",
          coordinates: [(longitude + 0.0001).toString(), latitude.toString()],
        },
      });
      post2 = new Post({
        content: "Test Post 2",
        author: user1._id,
        atUsers: [user2._id],
        location: {
          type: "Point",
          coordinates: [
            (longitude + 0.0002).toString(),
            (latitude + 0.0001).toString(),
          ],
        },
      });
      await post1.save();
      await post2.save();
    });

    it("should get recommended posts list", (done) => {
      chai
        .request(app)
        .get("/posts/recommended")
        .query({ longitude, latitude })
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((post, index) => {
            post.should.have.property("authorId");
            post.should.have.property("authorAvatar");
            post.should.have.property("content");
            post.should.have.property("postId");
            post.should.have.property("likeCount");
            post.should.have.property("commentCount");
            post.should.have.property("shareCount");
            post.should.have.property("isLiked");
            post.should.have.property("isFollowed");
            post.should.have.property("isBlocked");

            post.authorId.should.be.a("string");
            post.authorAvatar.should.be.a("string");
            post.content.should.be.a("string");
            post.postId.should.be.a("string");
            post.likeCount.should.be.a("number");
            post.commentCount.should.be.a("number");
            post.shareCount.should.be.a("number");
            post.isLiked.should.be.within(0, 1);
            post.isFollowed.should.be.within(0, 1);
            post.isBlocked.should.be.within(0, 1);

            if (post.hasOwnProperty("authorName")) {
              post.authorName.should.be.a("string");
            }

            if (post.hasOwnProperty("images")) {
              post.images.should.be.an("array");
            }

            if (post.hasOwnProperty("city")) {
              post.city.should.be.a("string");
            }

            if (post.hasOwnProperty("conversationId")) {
              post.conversationId.should.be.a("string");
            }

            if (post.hasOwnProperty("atUsers")) {
              post.atUsers.should.be.an("array");

              post.atUsers.forEach((user) => {
                user.should.have.property("id");

                user.id.should.be.a("string");

                if (user.hasOwnProperty("username")) {
                  user.username.should.be.a("string");
                }
              });
            }

            if (index === 0) {
              post.postId.should.be.equal(post1.id);
            } else if (index === 1) {
              post.postId.should.be.equal(post2.id);
            }
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/posts/recommended")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /posts/follows", () => {
    beforeEach(async () => {
      // 创建并保存测试帖子
      const user1 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
      });
      const user2 = new User({
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "avatar2.jpg",
      });
      await user1.save();
      await user2.save();
      user.following = [user1.id, user2.id];
      await user.save();

      const post1 = new Post({
        content: "Test Post 1",
        author: user1._id,
        atUsers: [user2._id],
      });
      const post2 = new Post({
        content: "Test Post 2",
        author: user1._id,
        atUsers: [user2._id],
      });
      await post1.save();
      await post2.save();
    });

    it("should get followed users posts list", (done) => {
      chai
        .request(app)
        .get("/posts/follows")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((post) => {
            post.should.have.property("authorId");
            post.should.have.property("authorAvatar");
            post.should.have.property("createTime");
            post.should.have.property("content");
            post.should.have.property("postId");
            post.should.have.property("likeCount");
            post.should.have.property("commentCount");
            post.should.have.property("shareCount");
            post.should.have.property("isLiked");
            post.should.have.property("isBlocked");

            post.authorId.should.be.a("string");
            post.authorAvatar.should.be.a("string");
            post.createTime.should.be.a("number");
            post.content.should.be.a("string");
            post.postId.should.be.a("string");
            post.likeCount.should.be.a("number");
            post.commentCount.should.be.a("number");
            post.shareCount.should.be.a("number");
            post.isLiked.should.be.within(0, 1);
            post.isBlocked.should.be.within(0, 1);

            if (post.hasOwnProperty("authorName")) {
              post.authorName.should.be.a("string");
            }

            if (post.hasOwnProperty("images")) {
              post.images.should.be.an("array");
            }

            if (post.hasOwnProperty("city")) {
              post.city.should.be.a("string");
            }

            if (post.hasOwnProperty("conversationId")) {
              post.conversationId.should.be.a("string");
            }

            if (post.hasOwnProperty("atUsers")) {
              post.atUsers.should.be.an("array");

              post.atUsers.forEach((user) => {
                user.should.have.property("id");

                user.id.should.be.a("string");

                if (user.hasOwnProperty("username")) {
                  user.username.should.be.a("string");
                }
              });
            }
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/posts/follows")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /users/me/posts", () => {
    beforeEach(async () => {
      // 创建并保存测试帖子
      const user1 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
        username: "atUser1",
      });
      const user2 = new User({
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "avatar2.jpg",
        username: "atUser2",
      });
      await user1.save();
      await user2.save();
      user.following = [user1.id, user2.id];
      await user.save();

      const post1 = new Post({
        content: "Test Post 1",
        author: user._id,
        atUsers: [user1._id, user2._id],
      });
      const post2 = new Post({
        content: "Test Post 2",
        author: user._id,
        atUsers: [user1._id, user2._id],
      });
      await post1.save();
      await post2.save();
    });

    it("should get my posts list", (done) => {
      chai
        .request(app)
        .get("/users/me/posts")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((post) => {
            post.should.have.property("postId");
            post.should.have.property("createTime");
            post.should.have.property("content");
            post.should.have.property("atUsers");

            post.postId.should.be.a("string");
            post.createTime.should.be.a("number");
            post.content.should.be.a("string");

            post.atUsers.should.be.an("array").and.have.lengthOf(2);

            post.atUsers.forEach((user) => {
              user.should.have.property("id");
              user.should.have.property("username");

              user.id.should.be.a("string");
              user.username.should.be.a("string");
            });

            if (post.hasOwnProperty("images")) {
              post.images.should.be.an("array");
            }

            if (post.hasOwnProperty("city")) {
              post.city.should.be.a("string");
            }
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/users/me/posts")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /users/:userId/posts", () => {
    let user1;
    let user2;

    beforeEach(async () => {
      // 创建并保存测试帖子
      user1 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
        username: "atUser1",
      });
      user2 = new User({
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "avatar2.jpg",
        username: "atUser2",
      });
      await user1.save();
      await user2.save();
      user.following = [user1.id, user2.id];
      await user.save();

      const post1 = new Post({
        content: "Test Post 1",
        author: user1.id,
        atUsers: [user1._id, user2._id],
        visibility: 0, // 设置 visibility 值为 0，公开可见
      });
      const post2 = new Post({
        content: "Test Post 2",
        author: user1.id,
        atUsers: [user1._id, user2._id],
        visibility: 1, // 设置 visibility 值为 1，主页可见
      });
      const post3 = new Post({
        content: "Test Post 3",
        author: user1.id,
        atUsers: [user1._id, user2._id],
        visibility: 2, // 设置 visibility 值为 2，自己可见
      });
      await post1.save();
      await post2.save();
      await post3.save();
    });

    it("should get user posts list excluding visibility 2 posts", async () => {
      const res = await chai
        .request(app)
        .get(`/users/${user1.id}/posts`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.an("array");

      res.body.forEach((post) => {
        post.should.have.property("postId");
        post.should.have.property("createTime");
        post.should.have.property("content");
        post.should.have.property("atUsers");

        post.postId.should.be.a("string");
        post.createTime.should.be.a("number");
        post.content.should.be.a("string");

        post.atUsers.should.be.an("array").and.have.lengthOf(2);

        post.atUsers.forEach((user) => {
          user.should.have.property("id");
          user.should.have.property("username");

          user.id.should.be.a("string");
          user.username.should.be.a("string");
        });

        if (post.hasOwnProperty("images")) {
          post.images.should.be.an("array");
        }

        if (post.hasOwnProperty("city")) {
          post.city.should.be.a("string");
        }
      });

      // 验证排除了 visibility 值为 2 的帖子
      res.body.forEach(async (post) => {
        const postModel = await Post.findById(post.postId);
        const { visibility } = postModel;
        visibility.should.not.equal(2);
      });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get(`/users/${user1.id}/posts`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /users/me/posts/{postId}", () => {
    let postId;
    let postsToken;

    before(async () => {
      // 创建测试艾特用户
      const atUser1 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
        username: "atUser1",
      });
      await atUser1.save();
      const atUser2 = new User({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "avatar1.jpg",
        username: "atUser2",
      });
      await atUser2.save();

      // 创建一个测试帖子
      const createPostResponse = await chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Test post",
          city: "北京",
          images: ["/uploads/xxx1.png", "/uploads/xxx2.png"],
          atUsers: [atUser1.id, atUser2.id],
        });

      postId = createPostResponse.body.postId;

      postsToken = token;
    });

    it("should get my post details", (done) => {
      chai
        .request(app)
        .get(`/users/me/posts/${postId}`)
        .set("Authorization", `Bearer ${postsToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("createTime");
          res.body.should.have.property("content");
          res.body.should.have.property("postId");
          res.body.should.have.property("isLiked");
          res.body.should.have.property("atUsers");

          // 验证可选字段
          if (res.body.hasOwnProperty("images")) {
            res.body.images.should.be.an("array");
          }

          if (res.body.hasOwnProperty("city")) {
            res.body.city.should.be.a("string");
          }

          // 验证计数字段
          res.body.should.have.property("likeCount");
          res.body.should.have.property("commentCount");
          res.body.should.have.property("shareCount");

          res.body.atUsers.should.be.an("array").and.have.lengthOf(2);

          res.body.atUsers.forEach((user) => {
            user.should.have.property("id");
            user.should.have.property("username");

            user.id.should.be.a("string");
            user.username.should.be.a("string");
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get(`/users/me/posts/${postId}`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it("should return 404 if post does not exist", (done) => {
      chai
        .request(app)
        .get("/users/me/posts/nonExistentPostId")
        .set("Authorization", `Bearer ${postsToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });
});
