const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe, beforeEach } = require("mocha");
const app = require("../../app");
const {
  generateRandomUsername,
  generateStrongPassword,
} = require("../../utils/authUtils");
const bcrypt = require("bcrypt");
const config = require("../../config");
const AdminUser = require("../../models/AdminUser");
const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("Comment Admin API", () => {
  let adminToken;
  let author1;
  let atUser1;
  let likeUser1;
  let collectUser1;
  let author2;
  let atUser2;
  let likeUser2;
  let collectUser2;
  let post1;
  let post2;

  beforeEach(async () => {
    // 在此处进行管理员用户的登录获取管理员 token 的操作
    // 生成随机的用户名
    const username = generateRandomUsername();

    // 生成高强度密码
    const password = generateStrongPassword();

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash(password, config.saltRounds);
    const adminUser = new AdminUser({
      username: username,
      password: hashedPassword,
    });
    await adminUser.save();

    // 生成管理员用户登录 JWT Token
    adminToken = jwt.sign({ adminId: adminUser.id }, config.jwtAdminSecret);

    // 创建测试用模型
    author1 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "author1",
      city: "City1",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await author1.save();

    atUser1 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar2.png",
      giftsReceived: 0,
      username: "atUser1",
      city: "City2",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await atUser1.save();

    likeUser1 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar2.png",
      giftsReceived: 0,
      username: "atUser1",
      city: "City2",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await likeUser1.save();

    collectUser1 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "author1",
      city: "City1",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await collectUser1.save();

    author2 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar3.png",
      giftsReceived: 0,
      username: "author2",
      city: "City3",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await author2.save();

    atUser2 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar4.png",
      giftsReceived: 0,
      username: "atUser2",
      city: "City4",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await atUser2.save();

    likeUser2 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar4.png",
      giftsReceived: 0,
      username: "atUser2",
      city: "City4",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await likeUser2.save();

    collectUser2 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "author1",
      city: "City1",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await collectUser2.save();

    post1 = new Post({
      content: "Post 1",
      author: author1.id,
    });
    await post1.save();

    post2 = new Post({
      content: "Post 2",
      author: author2.id,
    });
    await post2.save();
  });

  describe("POST /admin/comments", () => {
    it("should create a new comment", (done) => {
      const newComment = {
        content: "这是一个评论",
        post: post1._id,
        author: author2.id,
        likes: [likeUser1.id, likeUser1.id],
      };

      chai
        .request(app)
        .post("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newComment)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");

          const newComment = {
            content: "这是一个评论",
            post: post1._id,
            author: author2.id,
            parentId: res.body.id, // 如果有父评论，填入对应的父评论的唯一标识符
            likes: [likeUser1.id, likeUser1.id],
          };

          chai
            .request(app)
            .post("/admin/comments")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newComment)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body).to.have.property("id");

              done();
            });
        });
    });
  });

  describe("DELETE /admin/comments", () => {
    let commentIds; // 用于存储评论的ID

    beforeEach(async () => {
      // 创建两个评论模型并获取它们的ID
      const comment1 = new Comment({
        content: "Comment 1",
        post: post1.id,
        author: author2.id,
      });
      await comment1.save();

      const comment2 = new Comment({
        content: "Comment 2",
        post: post2.id,
        author: author1.id,
      });
      await comment2.save();

      commentIds = [comment1.id, comment2.id];
    });

    it("should delete comments and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: commentIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedComments = await Comment.find({
              _id: { $in: commentIds },
            });
            expect(deletedComments).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  describe("GET /admin/comments", () => {
    let comment1;
    let comment2;

    beforeEach(async () => {
      // 创建测试数据
      comment1 = new Comment({
        content: "这是一条评论内容",
        post: post1.id,
        author: author1.id,
      });
      await comment1.save();

      comment2 = new Comment({
        content: "这是另一条评论内容",
        post: post2.id,
        author: author2.id,
        parentId: comment1.id,
      });
      await comment2.save();
    });

    it("should get a paginated list of comments", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page, pageSize })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("page", page);
          expect(res.body).to.have.property("pageSize", pageSize);
          expect(res.body).to.have.property("total");
          expect(res.body).to.have.property("items").to.be.an("array");
          done();
        });
    });

    it("should filter comments by post", (done) => {
      const postId = post1.id; // 替换为实际的帖子ID

      chai
        .request(app)
        .get("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ postId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].post).to.equal(postId);
          done();
        });
    });

    it("should filter comments by author", (done) => {
      const authorId = author1.id; // 替换为实际的作者ID

      chai
        .request(app)
        .get("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ author: authorId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].author.id).to.equal(authorId);
          done();
        });
    });

    it("should filter comments by parent comment", (done) => {
      const parentId = comment1.id; // 替换为实际的父评论ID

      chai
        .request(app)
        .get("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ parentId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].parentId).to.equal(parentId);
          done();
        });
    });

    it("should filter comments by keyword", (done) => {
      const keyword = "评论内容";

      chai
        .request(app)
        .get("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ keyword })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].content).to.include(keyword);
          done();
        });
    });

    it("should sort comments by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          expect(res.body.items).to.deep.equal(sortedItems);

          done();
        });
    });
  });

  describe("PUT /admin/comments/:commentId", () => {
    let comment1;
    let comment2;

    beforeEach(async () => {
      // 创建测试数据
      comment1 = new Comment({
        content: "这是一条评论内容",
        post: post1.id,
        author: author1.id,
      });
      await comment1.save();

      comment2 = new Comment({
        content: "这是另一条评论内容",
        post: post2.id,
        author: author2.id,
        parentId: comment1.id,
      });
      await comment2.save();
    });

    it("should update a comment", (done) => {
      const updatedComment = {
        content: "更新后的评论内容",
        post: post2.id, // 假设存在一个名为 postId 的帖子
        author: author2.id,
        parentId: comment2.id, // 假设存在一个名为 parentId 的父评论
        likes: [likeUser1.id, likeUser2.id],
      };

      chai
        .request(app)
        .put(`/admin/comments/${comment1.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedComment)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          Comment.findById(comment1.id, (err, comment) => {
            expect(comment.content).to.equal(updatedComment.content);
            expect(comment.post.toString()).to.equal(updatedComment.post);
            expect(comment.author.toString()).to.equal(updatedComment.author);
            expect(comment.parentId.toString()).to.equal(
              updatedComment.parentId
            );
            expect(comment.likes.map((user) => user.toString())).to.deep.equal(
              updatedComment.likes
            );
            done();
          });
        });
    });
  });
});
