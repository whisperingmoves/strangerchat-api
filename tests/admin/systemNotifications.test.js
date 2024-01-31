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
        notificationType: 0,
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
        notificationType: 0,
        notificationTitle: "Notification 1",
        notificationContent: "Content 1",
      });
      await systemNotification1.save();

      const systemNotification2 = new SystemNotification({
        toUser: toUser2.id,
        notificationType: 0,
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

  describe("GET /admin/systemNotifications", () => {
    beforeEach(async () => {
      // 创建测试数据
      const systemNotification1 = new SystemNotification({
        toUser: toUser1.id,
        notificationType: 0,
        notificationTitle: "Notification 1",
        notificationContent: "This is notification 1",
      });
      await systemNotification1.save();

      const systemNotification2 = new SystemNotification({
        toUser: toUser2.id,
        notificationType: 0,
        notificationTitle: "Notification 2",
        notificationContent: "This is notification 2",
      });
      await systemNotification2.save();
    });

    it("should get a paginated list of system notifications", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/systemNotifications")
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

    it("should filter system notifications by toUser", (done) => {
      const toUser = toUser1.id; // 替换为实际的接收通知的用户ID

      chai
        .request(app)
        .get("/admin/systemNotifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ toUser })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].toUser.id).to.equal(toUser);
          done();
        });
    });

    it("should sort system notifications by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/systemNotifications")
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

  describe("PUT /admin/systemNotifications/:systemNotificationId", () => {
    let systemNotificationId;

    before((done) => {
      // 创建系统类通知
      const newSystemNotification = {
        toUser: toUser1.id,
        notificationType: 0,
        notificationTitle: "Notification 1",
        notificationContent: "This is notification 1",
      };

      SystemNotification.create(
        newSystemNotification,
        (err, systemNotification) => {
          systemNotificationId = systemNotification._id; // 保存新增系统类通知的ID
          done();
        }
      );
    });

    it("should update a system notification", (done) => {
      const updatedSystemNotification = {
        toUser: toUser2.id,
        notificationType: 1,
        notificationTitle: "Notification 2",
        notificationContent: "This is notification 2",
        notificationTime: new Date(),
        readStatus: 1,
      };

      chai
        .request(app)
        .put(`/admin/systemNotifications/${systemNotificationId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedSystemNotification)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          SystemNotification.findById(
            systemNotificationId,
            (err, systemNotification) => {
              expect(systemNotification.toUser.toString()).to.equal(
                updatedSystemNotification.toUser
              );
              expect(systemNotification.notificationType).to.equal(
                updatedSystemNotification.notificationType
              );
              expect(systemNotification.notificationTitle).to.equal(
                updatedSystemNotification.notificationTitle
              );
              expect(systemNotification.notificationContent).to.equal(
                updatedSystemNotification.notificationContent
              );
              expect(systemNotification.notificationTime).to.eql(
                new Date(updatedSystemNotification.notificationTime)
              );
              expect(systemNotification.readStatus).to.equal(
                updatedSystemNotification.readStatus
              );
              done();
            }
          );
        });
    });
  });
});
