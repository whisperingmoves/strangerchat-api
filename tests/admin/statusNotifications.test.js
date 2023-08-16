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
const StatusNotification = require("../../models/StatusNotification");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("StatusNotifications Admin API", () => {
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

  describe("POST /admin/statusNotifications", () => {
    it("should create a new status notification", (done) => {
      const newStatusNotification = {
        toUser: toUser1.id,
        user: user1.id,
        statusType: 0,
        statusTime: new Date(),
        readStatus: 0,
      };

      chai
        .request(app)
        .post("/admin/statusNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newStatusNotification)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/statusNotifications", () => {
    let statusNotificationIds; // 用于存储状态类通知的ID

    beforeEach(async () => {
      // 创建两个状态类通知模型并获取它们的ID
      const statusNotification1 = new StatusNotification({
        toUser: toUser1.id,
        user: user1.id,
        statusType: 0,
      });
      await statusNotification1.save();

      const statusNotification2 = new StatusNotification({
        toUser: toUser2.id,
        user: user2.id,
        statusType: 1,
      });
      await statusNotification2.save();

      statusNotificationIds = [statusNotification1.id, statusNotification2.id];
    });

    it("should delete status notifications and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/statusNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: statusNotificationIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedStatusNotifications = await StatusNotification.find({
              _id: { $in: statusNotificationIds },
            });
            expect(deletedStatusNotifications).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  describe("GET /admin/statusNotifications", () => {
    beforeEach(async () => {
      // 创建测试数据
      const statusNotification1 = new StatusNotification({
        toUser: toUser1.id,
        user: user1.id,
        statusType: 0,
      });
      await statusNotification1.save();

      const statusNotification2 = new StatusNotification({
        toUser: toUser2.id,
        user: user2.id,
        statusType: 1,
      });
      await statusNotification2.save();
    });

    it("should get a paginated list of status notifications", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/statusNotifications")
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

    it("should filter status notifications by toUser", (done) => {
      const toUser = toUser1.id; // 替换为实际的接收通知的用户ID

      chai
        .request(app)
        .get("/admin/statusNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ toUser })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].toUser.id).to.equal(toUser);
          done();
        });
    });

    it("should filter status notifications by user", (done) => {
      const user = user1.id; // 替换为实际的触发通知的用户ID

      chai
        .request(app)
        .get("/admin/statusNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ user })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].user.id).to.equal(user);
          done();
        });
    });

    it("should filter status notifications by statusType", (done) => {
      const statusType = 0; // 替换为实际的状态类型

      chai
        .request(app)
        .get("/admin/statusNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ statusType })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].statusType).to.equal(statusType);
          done();
        });
    });

    it("should sort status notifications by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/statusNotifications")
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

  describe("PUT /admin/statusNotifications/:statusNotificationId", () => {
    let statusNotificationId;

    before((done) => {
      // 创建状态类通知
      const newStatusNotification = {
        toUser: toUser1.id,
        user: user1.id,
        statusType: 0,
        statusTime: new Date(),
        readStatus: 0,
      };

      StatusNotification.create(
        newStatusNotification,
        (err, statusNotification) => {
          statusNotificationId = statusNotification._id; // 保存新增状态类通知的ID
          done();
        }
      );
    });

    it("should update a status notification", (done) => {
      const updatedStatusNotification = {
        toUser: toUser2.id,
        user: user2.id,
        statusType: 1,
        statusTime: new Date(),
        readStatus: 1,
      };

      chai
        .request(app)
        .put(`/admin/statusNotifications/${statusNotificationId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedStatusNotification)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          StatusNotification.findById(
            statusNotificationId,
            (err, statusNotification) => {
              expect(statusNotification.toUser.toString()).to.equal(
                updatedStatusNotification.toUser
              );
              expect(statusNotification.user.toString()).to.equal(
                updatedStatusNotification.user
              );
              expect(statusNotification.statusType).to.equal(
                updatedStatusNotification.statusType
              );
              expect(statusNotification.statusTime).to.eql(
                new Date(updatedStatusNotification.statusTime)
              );
              expect(statusNotification.readStatus).to.equal(
                updatedStatusNotification.readStatus
              );
              done();
            }
          );
        });
    });
  });
});
