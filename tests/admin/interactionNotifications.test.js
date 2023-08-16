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
});
