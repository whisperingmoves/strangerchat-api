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
const GiftNotification = require("../../models/GiftNotification");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("GiftNotifications Admin API", () => {
  let adminToken;
  let toUser1;
  let user1;
  let toUser2;
  let user2;

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
  });

  describe("POST /admin/giftNotifications", () => {
    it("should create a new gift notification", (done) => {
      const newGiftNotification = {
        toUser: toUser1.id,
        user: user1.id,
        giftQuantity: 5,
        giftName: "Flower",
        giftTime: new Date().toISOString(),
        readStatus: 0,
      };

      chai
        .request(app)
        .post("/admin/giftNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGiftNotification)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/giftNotifications", () => {
    let giftNotificationIds; // 用于存储礼物类通知的ID

    beforeEach(async () => {
      // 创建两个礼物类通知模型并获取它们的ID
      const giftNotification1 = new GiftNotification({
        toUser: toUser1.id,
        user: user1.id,
        giftQuantity: 5,
        giftName: "Gift 1",
      });
      await giftNotification1.save();

      const giftNotification2 = new GiftNotification({
        toUser: toUser2.id,
        user: user2.id,
        giftQuantity: 10,
        giftName: "Gift 2",
      });
      await giftNotification2.save();

      giftNotificationIds = [giftNotification1.id, giftNotification2.id];
    });

    it("should delete gift notifications and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/giftNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: giftNotificationIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedGiftNotifications = await GiftNotification.find({
              _id: { $in: giftNotificationIds },
            });
            expect(deletedGiftNotifications).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  describe("GET /admin/giftNotifications", () => {
    beforeEach(async () => {
      // 创建测试数据
      const giftNotification1 = new GiftNotification({
        toUser: toUser1.id,
        user: user1.id,
        giftQuantity: 5,
        giftName: "Gift 1",
      });
      await giftNotification1.save();

      const giftNotification2 = new GiftNotification({
        toUser: toUser2.id,
        user: user2.id,
        giftQuantity: 3,
        giftName: "Gift 2",
      });
      await giftNotification2.save();
    });

    it("should get a paginated list of gift notifications", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/giftNotifications")
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

    it("should filter gift notifications by toUser", (done) => {
      const toUser = toUser1.id; // 替换为实际的接收通知的用户ID

      chai
        .request(app)
        .get("/admin/giftNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ toUser })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].toUser.id).to.equal(toUser);
          done();
        });
    });

    it("should filter gift notifications by user", (done) => {
      const user = user1.id; // 替换为实际的触发通知的用户ID

      chai
        .request(app)
        .get("/admin/giftNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ user })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].user.id).to.equal(user);
          done();
        });
    });

    it("should sort gift notifications by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/giftNotifications")
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
});
