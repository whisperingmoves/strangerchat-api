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
});
