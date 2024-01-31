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
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const User = require("../../models/User");
const VoiceCallRecord = require("../../models/VoiceCallRecord");
const expect = chai.expect;
chai.use(chaiHttp);

describe("VoiceCallRecords Admin API", () => {
  let adminToken;
  let caller1;
  let recipient1;
  let caller2;
  let recipient2;

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

    // 创建测试用户模型
    caller1 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "caller1",
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
    await caller1.save();

    recipient1 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar2.png",
      giftsReceived: 0,
      username: "recipient1",
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
    await recipient1.save();

    caller2 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar3.png",
      giftsReceived: 0,
      username: "caller2",
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
    await caller2.save();

    recipient2 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar4.png",
      giftsReceived: 0,
      username: "recipient2",
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
    await recipient2.save();
  });

  describe("POST /admin/voiceCallRecords", () => {
    it("should create a new voice call record", (done) => {
      const newVoiceCallRecord = {
        callerId: caller1.id,
        recipientId: recipient1.id,
        startTime: "2023-08-11T10:30:00Z",
        endTime: "2023-08-11T10:45:00Z",
      };

      chai
        .request(app)
        .post("/admin/voiceCallRecords")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newVoiceCallRecord)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/voiceCallRecords", () => {
    let voiceCallRecordIds;

    before((done) => {
      const newVoiceCallRecord1 = {
        callerId: caller1.id,
        recipientId: recipient1.id,
        startTime: new Date(),
      };

      const newVoiceCallRecord2 = {
        callerId: caller2.id,
        recipientId: recipient2.id,
        startTime: new Date(),
      };

      VoiceCallRecord.create(
        [newVoiceCallRecord1, newVoiceCallRecord2],
        (err, records) => {
          voiceCallRecordIds = records.map((record) =>
            record._id.toHexString()
          );
          done();
        }
      );
    });

    it("should delete voice call records", (done) => {
      chai
        .request(app)
        .delete("/admin/voiceCallRecords")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: voiceCallRecordIds })
        .end((err, res) => {
          expect(res).to.have.status(204);

          // 验证删除是否成功
          VoiceCallRecord.find(
            { _id: { $in: voiceCallRecordIds } },
            (err, records) => {
              expect(records).to.have.lengthOf(0);
              done();
            }
          );
        });
    });
  });

  describe("GET /admin/voiceCallRecords", () => {
    beforeEach(async () => {
      // 创建测试数据
      const voiceCallRecord1 = new VoiceCallRecord({
        callerId: caller1.id,
        recipientId: recipient1.id,
        startTime: new Date("2023-08-09T10:51:00.000Z"),
        endTime: new Date("2023-08-09T10:52:00.000Z"),
      });
      await voiceCallRecord1.save();

      const voiceCallRecord2 = new VoiceCallRecord({
        callerId: caller2.id,
        recipientId: recipient2.id,
        startTime: new Date("2023-08-09T11:00:00.000Z"),
        endTime: new Date("2023-08-09T11:02:00.000Z"),
      });
      await voiceCallRecord2.save();
    });

    it("should get a paginated list of voice call records", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/voiceCallRecords")
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

    it("should filter voice call records by callerId", (done) => {
      const callerId = caller1.id; // 替换为实际的主叫者ID

      chai
        .request(app)
        .get("/admin/voiceCallRecords")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ callerId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].caller.id).to.equal(callerId);
          done();
        });
    });

    it("should filter voice call records by recipientId", (done) => {
      const recipientId = recipient1.id; // 替换为实际的被叫者ID

      chai
        .request(app)
        .get("/admin/voiceCallRecords")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ recipientId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].recipient.id).to.equal(recipientId);
          done();
        });
    });

    it("should sort voice call records by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/voiceCallRecords")
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

  describe("PUT /admin/voiceCallRecords/:voiceCallRecordId", () => {
    let voiceCallRecordId;

    before((done) => {
      // 创建语音通话记录
      const newVoiceCallRecord = {
        callerId: caller1.id,
        recipientId: recipient1.id,
        startTime: new Date("2023-08-11T10:00:00Z"),
      };

      VoiceCallRecord.create(newVoiceCallRecord, (err, voiceCallRecord) => {
        voiceCallRecordId = voiceCallRecord._id; // 保存新增语音通话记录的ID
        done();
      });
    });

    it("should update a voice call record", (done) => {
      const updatedVoiceCallRecord = {
        callerId: caller2.id,
        recipientId: recipient2.id,
        startTime: new Date("2023-08-11T11:00:00Z"),
        endTime: new Date("2023-08-11T11:30:00Z"),
      };

      chai
        .request(app)
        .put(`/admin/voiceCallRecords/${voiceCallRecordId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedVoiceCallRecord)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          VoiceCallRecord.findById(
            voiceCallRecordId,
            (err, voiceCallRecord) => {
              expect(voiceCallRecord.callerId.toString()).to.equal(
                updatedVoiceCallRecord.callerId
              );
              expect(voiceCallRecord.recipientId.toString()).to.equal(
                updatedVoiceCallRecord.recipientId
              );
              expect(voiceCallRecord.startTime.toISOString()).to.equal(
                updatedVoiceCallRecord.startTime.toISOString()
              );
              expect(voiceCallRecord.endTime.toISOString()).to.equal(
                updatedVoiceCallRecord.endTime.toISOString()
              );
              done();
            }
          );
        });
    });
  });
});
