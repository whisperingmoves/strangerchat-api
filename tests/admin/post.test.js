const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe, beforeEach, before } = require("mocha");
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
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("Post Admin API", () => {
  let adminToken;
  let author1;
  let atUser1;
  let likeUser1;
  let collectUser1;
  let author2;
  let atUser2;
  let likeUser2;
  let collectUser2;

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

    // 创建用户模型
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
  });

  describe("POST /admin/posts", () => {
    it("should create a new post", (done) => {
      const newPost = {
        content: "这是一个帖子",
        author: author1.id,
        city: "New York",
        location: {
          type: "Point",
          coordinates: [40.7128, -74.006],
        },
        images: ["image1.jpg", "image2.jpg"],
        visibility: 0,
        atUsers: [atUser1.id, atUser2.id],
        heatCount: 100,
        viewsCount: 50,
        likes: [likeUser1.id, likeUser2.id],
        collects: [collectUser1.id, collectUser2.id],
        shares: [
          {
            sharePlatform: 1,
            sharedAt: "2023-08-16T10:30:00Z",
          },
          {
            sharePlatform: 2,
            sharedAt: "2023-08-16T11:00:00Z",
          },
        ],
      };

      chai
        .request(app)
        .post("/admin/posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newPost)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/posts", () => {
    let postIds; // 用于存储帖子的ID

    beforeEach(async () => {
      // 创建两个帖子模型并获取它们的ID
      const post1 = new Post({
        content: "Post 1",
        author: author1.id,
      });
      await post1.save();

      const post2 = new Post({
        content: "Post 2",
        author: author2.id,
      });
      await post2.save();

      postIds = [post1.id, post2.id];
    });

    it("should delete posts and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: postIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedPosts = await Post.find({
              _id: { $in: postIds },
            });
            expect(deletedPosts).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  describe("GET /admin/posts", () => {
    beforeEach(async () => {
      // 创建测试数据
      const post1 = new Post({
        content: "这是一条帖子内容",
        author: author1.id,
        visibility: 0,
        heatCount: 100,
        viewsCount: 50,
        shares: [
          { sharePlatform: 1, sharedAt: new Date("2023-08-16T10:30:00Z") },
          { sharePlatform: 2, sharedAt: new Date("2023-08-16T11:00:00Z") },
        ],
      });
      await post1.save();

      const post2 = new Post({
        content: "这是另一条帖子内容",
        author: author2.id,
        visibility: 1,
        heatCount: 200,
        viewsCount: 100,
        shares: [
          { sharePlatform: 1, sharedAt: new Date("2023-08-16T09:30:00Z") },
          { sharePlatform: 3, sharedAt: new Date("2023-08-16T11:30:00Z") },
        ],
      });
      await post2.save();
    });

    it("should get a paginated list of posts", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/posts")
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

    it("should filter posts by author", (done) => {
      const authorId = author1.id; // 替换为实际的作者ID

      chai
        .request(app)
        .get("/admin/posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ author: authorId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].author.id).to.equal(authorId);
          done();
        });
    });

    it("should filter posts by keyword", (done) => {
      const keyword = "帖子内容";

      chai
        .request(app)
        .get("/admin/posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ keyword })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].content).to.include(keyword);
          done();
        });
    });

    it("should sort posts by updatedAt in descending order", (done) => {
      const sort = "updatedAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });
  });

  describe("PUT /admin/posts/:postId", () => {
    let postId;

    before((done) => {
      // 创建帖子
      const newPost = {
        content: "这是一个帖子",
        author: author1.id,
      };

      Post.create(newPost, (err, post) => {
        postId = post._id; // 保存新增帖子的ID
        done();
      });
    });

    it("should update a post", (done) => {
      const updatedPost = {
        content: "更新后的帖子内容",
        author: author2.id,
        city: "New York",
        location: {
          type: "Point",
          coordinates: [40.7128, -74.006],
        },
        images: ["image1.jpg", "image2.jpg"],
        visibility: 1,
        atUsers: [atUser1.id, atUser2.id],
        heatCount: 100,
        viewsCount: 50,
        likes: [likeUser1.id, likeUser2.id],
        collects: [collectUser1.id, collectUser2.id],
        shares: [
          {
            sharePlatform: 1,
            sharedAt: new Date("2023-08-16T10:30:00Z"),
          },
          {
            sharePlatform: 2,
            sharedAt: new Date("2023-08-16T11:00:00Z"),
          },
        ],
      };

      chai
        .request(app)
        .put(`/admin/posts/${postId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedPost)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          Post.findById(postId, (err, post) => {
            expect(post.content).to.equal(updatedPost.content);
            expect(post.author.toString()).to.equal(updatedPost.author);
            expect(post.city).to.equal(updatedPost.city);
            expect(post.location.type).to.equal(updatedPost.location.type);
            expect(post.location.coordinates).to.deep.equal(
              updatedPost.location.coordinates
            );
            expect(post.images).to.deep.equal(updatedPost.images);
            expect(post.visibility).to.equal(updatedPost.visibility);
            expect(post.atUsers.map((user) => user.toString())).to.deep.equal(
              updatedPost.atUsers
            );
            expect(post.heatCount).to.equal(updatedPost.heatCount);
            expect(post.viewsCount).to.equal(updatedPost.viewsCount);
            expect(post.likes.map((user) => user.toString())).to.deep.equal(
              updatedPost.likes
            );
            expect(post.collects.map((user) => user.toString())).to.deep.equal(
              updatedPost.collects
            );
            done();
          });
        });
    });
  });
});
