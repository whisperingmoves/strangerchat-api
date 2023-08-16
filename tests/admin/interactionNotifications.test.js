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
const Comment = require("../../models/Comment");
const InteractionNotification = require("../../models/InteractionNotification");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("InteractionNotifications Admin API", () => {
  let adminToken;
  let toUser1;
  let user1;
  let post1;
  let comment1;
  let toUser2;
  let user2;
  let post2;
  let comment2;

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
    toUser1 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "sender1",
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
    await toUser1.save();

    user1 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar2.png",
      giftsReceived: 0,
      username: "receiver1",
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
    await user1.save();

    toUser2 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar3.png",
      giftsReceived: 0,
      username: "sender2",
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
    await toUser2.save();

    user2 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar4.png",
      giftsReceived: 0,
      username: "receiver2",
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
    await user2.save();

    // 创建帖子模型
    post1 = new Post({
      content: "Post 1 content",
      city: "City1",
      author: user1._id,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      images: ["/images/image1.jpg"],
      visibility: 1,
      atUsers: [toUser1._id],
      heatCount: 0,
      viewsCount: 0,
      likes: [],
      collects: [],
      shares: [],
      createdAt: new Date(),
    });
    await post1.save();

    post2 = new Post({
      content: "Post 2 content",
      city: "City2",
      author: user2._id,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      images: ["/images/image2.jpg"],
      visibility: 1,
      atUsers: [toUser2._id],
      heatCount: 0,
      viewsCount: 0,
      likes: [],
      collects: [],
      shares: [],
      createdAt: new Date(),
    });
    await post2.save();

    // 创建评论模型
    comment1 = new Comment({
      content: "Comment 1 content",
      post: post1._id,
      author: user1._id,
      parentId: null,
      createdAt: new Date(),
      likes: [],
    });
    await comment1.save();

    comment2 = new Comment({
      content: "Comment 2 content",
      post: post2._id,
      author: user2._id,
      parentId: null,
      createdAt: new Date(),
      likes: [],
    });
    await comment2.save();
  });

  describe("POST /admin/interactionNotifications", () => {
    it("should create a new interaction notification", (done) => {
      const newInteractionNotification = {
        toUser: user1.id,
        user: user2.id,
        interactionType: 0,
        post: post1.id,
        interactionTime: new Date(),
        readStatus: 0,
      };

      chai
        .request(app)
        .post("/admin/interactionNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newInteractionNotification)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/interactionNotifications", () => {
    let interactionNotificationIds; // 用于存储交互类通知的ID

    beforeEach(async () => {
      // 创建两个交互类通知模型并获取它们的ID
      const interactionNotification1 = new InteractionNotification({
        toUser: user1.id,
        user: user2.id,
        interactionType: 0,
        post: post1.id,
      });
      await interactionNotification1.save();

      const interactionNotification2 = new InteractionNotification({
        toUser: user1.id,
        user: user2.id,
        interactionType: 1,
        post: post2.id,
        comment: comment1.id,
      });
      await interactionNotification2.save();

      interactionNotificationIds = [
        interactionNotification1.id,
        interactionNotification2.id,
      ];
    });

    it("should delete interaction notifications and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/interactionNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: interactionNotificationIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedInteractionNotifications =
              await InteractionNotification.find({
                _id: { $in: interactionNotificationIds },
              });
            expect(deletedInteractionNotifications).to.be.an("array").that.is
              .empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  describe("GET /admin/interactionNotifications", () => {
    beforeEach(async () => {
      // 创建测试数据
      const interactionNotification1 = new InteractionNotification({
        toUser: toUser1.id,
        user: user1.id,
        interactionType: 0,
        post: post1.id,
      });
      await interactionNotification1.save();

      const interactionNotification2 = new InteractionNotification({
        toUser: toUser2.id,
        user: user2.id,
        interactionType: 1,
        post: post2.id,
        comment: comment1.id,
      });
      await interactionNotification2.save();
    });

    it("should get a paginated list of interaction notifications", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/interactionNotifications")
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

    it("should filter interaction notifications by toUser", (done) => {
      const toUser = toUser1.id; // 替换为实际的接收通知的用户ID

      chai
        .request(app)
        .get("/admin/interactionNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ toUser })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].toUser.id).to.equal(toUser);
          done();
        });
    });

    it("should filter interaction notifications by user", (done) => {
      const user = user1.id; // 替换为实际的触发通知的用户ID

      chai
        .request(app)
        .get("/admin/interactionNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ user })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].user.id).to.equal(user);
          done();
        });
    });

    it("should filter interaction notifications by interactionType", (done) => {
      const interactionType = 0; // 替换为实际的交互类型

      chai
        .request(app)
        .get("/admin/interactionNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ interactionType })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].interactionType).to.equal(interactionType);
          done();
        });
    });

    it("should sort interaction notifications by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/interactionNotifications")
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

  describe("PUT /admin/interactionNotifications/:interactionNotificationId", () => {
    let interactionNotificationId;

    before((done) => {
      // 创建交互类通知
      const newInteractionNotification = {
        toUser: toUser1.id,
        user: user1.id,
        interactionType: 0,
        post: post1.id,
        comment: comment1.id,
        interactionTime: new Date(),
        readStatus: 0,
      };

      InteractionNotification.create(
        newInteractionNotification,
        (err, interactionNotification) => {
          interactionNotificationId = interactionNotification._id; // 保存新增交互类通知的ID
          done();
        }
      );
    });

    it("should update an interaction notification", (done) => {
      const updatedInteractionNotification = {
        toUser: toUser2.id,
        user: user2.id,
        interactionType: 1,
        post: post2.id,
        comment: comment2.id,
        interactionTime: new Date(),
        readStatus: 1,
      };

      chai
        .request(app)
        .put(`/admin/interactionNotifications/${interactionNotificationId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedInteractionNotification)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          InteractionNotification.findById(
            interactionNotificationId,
            (err, interactionNotification) => {
              expect(interactionNotification.toUser.toString()).to.equal(
                updatedInteractionNotification.toUser
              );
              expect(interactionNotification.user.toString()).to.equal(
                updatedInteractionNotification.user
              );
              expect(interactionNotification.interactionType).to.equal(
                updatedInteractionNotification.interactionType
              );
              expect(interactionNotification.post.toString()).to.equal(
                updatedInteractionNotification.post
              );
              expect(interactionNotification.comment.toString()).to.equal(
                updatedInteractionNotification.comment
              );
              expect(interactionNotification.interactionTime).to.eql(
                new Date(updatedInteractionNotification.interactionTime)
              );
              expect(interactionNotification.readStatus).to.equal(
                updatedInteractionNotification.readStatus
              );
              done();
            }
          );
        });
    });
  });
});
