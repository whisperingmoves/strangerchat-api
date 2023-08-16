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
const SystemNotification = require("../../models/SystemNotification");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("SystemNotifications Admin API", () => {
  let adminToken;
  let toUser1;
  let toUser2;

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
  });

  describe("POST /admin/systemNotifications", () => {
    it("should create a new system notification", (done) => {
      const newSystemNotification = {
        toUser: toUser1.id,
        notificationTitle: "系统通知",
        notificationContent: "这是一条系统通知",
        notificationTime: new Date().toISOString(),
        readStatus: 0,
      };

      chai
        .request(app)
        .post("/admin/systemNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newSystemNotification)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/systemNotifications", () => {
    let systemNotificationIds; // 用于存储系统类通知的ID

    beforeEach(async () => {
      // 创建两个系统类通知模型并获取它们的ID
      const systemNotification1 = new SystemNotification({
        toUser: toUser1.id,
        notificationTitle: "Notification 1",
        notificationContent: "Content 1",
      });
      await systemNotification1.save();

      const systemNotification2 = new SystemNotification({
        toUser: toUser2.id,
        notificationTitle: "Notification 2",
        notificationContent: "Content 2",
      });
      await systemNotification2.save();

      systemNotificationIds = [systemNotification1.id, systemNotification2.id];
    });

    it("should delete system notifications and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/systemNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: systemNotificationIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedSystemNotifications = await SystemNotification.find({
              _id: { $in: systemNotificationIds },
            });
            expect(deletedSystemNotifications).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });
});
