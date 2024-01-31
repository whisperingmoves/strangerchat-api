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
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("Users Admin API", () => {
  let adminToken;

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
  });

  describe("POST /admin/users", () => {
    it("should create a new user", (done) => {
      const newUser = {
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "/avatars/user001.png",
        giftsReceived: 5,
        username: "JohnDoe",
        city: "New York",
        followingCount: 10,
        followersCount: 20,
        visitorsCount: 100,
        freeHeatsLeft: 2,
        coinBalance: 500,
        checkedDays: 7,
        lastCheckDate: "2023-08-10T09:00:00Z",
        location: {
          type: "Point",
          coordinates: [-73.9857, 40.7484],
        },
        following: [],
        blockedUsers: [],
        receivedGiftRankings: [],
        online: 1,
      };

      chai
        .request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");

          const userId = res.body.id;

          // 查询数据库验证用户是否创建成功
          User.findById(userId)
            .then((user) => {
              expect(user).to.exist;
              expect(user.mobile).to.equal(newUser.mobile);
              expect(user.gender).to.equal(newUser.gender);
              // 验证其他属性...

              done();
            })
            .catch((error) => done(error));
        });
    });
  });

  describe("DELETE /admin/users", () => {
    let userIds;

    before((done) => {
      const newUser1 = {
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "/avatars/avatar1.png",
      };

      const newUser2 = {
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "/avatars/avatar2.png",
      };

      chai
        .request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser1)
        .end((err, res) => {
          expect(res).to.have.status(201);
          const userId1 = res.body.id;

          chai
            .request(app)
            .post("/admin/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newUser2)
            .end((err, res) => {
              expect(res).to.have.status(201);
              const userId2 = res.body.id;

              userIds = [userId1, userId2];
              done();
            });
        });
    });

    it("should delete users", (done) => {
      chai
        .request(app)
        .delete("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: userIds })
        .end((err, res) => {
          expect(res).to.have.status(204);

          // 验证删除是否成功
          User.find({ _id: { $in: userIds } }, (err, users) => {
            expect(users).to.have.lengthOf(0);
            done();
          });
        });
    });
  });

  describe("GET /admin/users", () => {
    before((done) => {
      // Create new users for testing
      const newUser1 = {
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "/avatars/user001.png",
        giftsReceived: 5,
        username: "JohnDoe",
        city: "New York",
        followingCount: 10,
        followersCount: 20,
        visitorsCount: 100,
        freeHeatsLeft: 2,
        coinBalance: 500,
        checkedDays: 7,
        lastCheckDate: "2023-08-10T09:00:00Z",
        location: {
          type: "Point",
          coordinates: [-73.9857, 40.7484],
        },
        following: [],
        blockedUsers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        receivedGiftRankings: [],
        online: 1,
      };

      const newUser2 = {
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "/avatars/user002.png",
        giftsReceived: 10,
        username: "JaneSmith",
        city: "Los Angeles",
        followingCount: 5,
        followersCount: 15,
        visitorsCount: 50,
        freeHeatsLeft: 1,
        coinBalance: 1000,
        checkedDays: 5,
        lastCheckDate: "2023-08-05T09:00:00Z",
        location: {
          type: "Point",
          coordinates: [-118.2437, 34.0522],
        },
        following: [],
        blockedUsers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        receivedGiftRankings: [],
        online: 0,
      };

      // Create user 1
      chai
        .request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser1)
        .end((err, res) => {
          expect(res).to.have.status(201);

          // Create user 2
          chai
            .request(app)
            .post("/admin/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newUser2)
            .end((err, res) => {
              expect(res).to.have.status(201);
              done();
            });
        });
    });

    it("should get a paginated list of users", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page, pageSize })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("page", page);
          expect(res.body).to.have.property("pageSize", pageSize);
          expect(res.body).to.have.property("items").to.be.an("array");
          done();
        });
    });

    it("should filter users by keyword", (done) => {
      const keyword = "JohnDoe";

      chai
        .request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ keyword })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items).to.have.lengthOf.above(0);
          expect(res.body.items[0].username).to.equal(keyword);
          done();
        });
    });

    it("should sort users by createdAt in ascending order", (done) => {
      const sort = "createdAt";
      const order = "asc";

      chai
        .request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });
  });

  describe("PUT /admin/users/:userId", () => {
    let userId;

    before((done) => {
      // 创建用户
      const newUser = {
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date(),
        avatar: "/avatars/user001.png",
        giftsReceived: 5,
        username: "JohnDoe",
        city: "New York",
        followingCount: 10,
        followersCount: 20,
        visitorsCount: 100,
        freeHeatsLeft: 2,
        coinBalance: 500,
        checkedDays: 7,
        lastCheckDate: "2023-08-10T09:00:00Z",
        location: {
          type: "Point",
          coordinates: [-73.9857, 40.7484],
        },
        following: [],
        blockedUsers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        receivedGiftRankings: [],
        online: 1,
      };

      chai
        .request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser)
        .end((err, res) => {
          expect(res).to.have.status(201);
          userId = res.body.id; // 保存创建的用户的ID
          done();
        });
    });

    it("should update a user with all fields", (done) => {
      const updatedUser = {
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date(),
        avatar: "/avatars/user002.png",
        giftsReceived: 10,
        username: "JaneDoe",
        city: "Los Angeles",
        followingCount: 20,
        followersCount: 30,
        visitorsCount: 200,
        freeHeatsLeft: 1,
        coinBalance: 1000,
        checkedDays: 14,
        lastCheckDate: new Date(),
        location: {
          type: "Point",
          coordinates: [-118.2437, 34.0522],
        },
        following: [],
        blockedUsers: [],
        receivedGiftRankings: [],
        online: 0,
      };

      chai
        .request(app)
        .put(`/admin/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedUser)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          User.findById(userId, (err, user) => {
            expect(user.mobile).to.equal(updatedUser.mobile);
            expect(user.gender).to.equal(updatedUser.gender);
            expect(user.birthday).to.deep.equal(updatedUser.birthday);
            expect(user.avatar).to.equal(updatedUser.avatar);
            expect(user.giftsReceived).to.equal(updatedUser.giftsReceived);
            expect(user.username).to.equal(updatedUser.username);
            expect(user.city).to.equal(updatedUser.city);
            expect(user.followingCount).to.equal(updatedUser.followingCount);
            expect(user.followersCount).to.equal(updatedUser.followersCount);
            expect(user.visitorsCount).to.equal(updatedUser.visitorsCount);
            expect(user.freeHeatsLeft).to.equal(updatedUser.freeHeatsLeft);
            expect(user.coinBalance).to.equal(updatedUser.coinBalance);
            expect(user.checkedDays).to.equal(updatedUser.checkedDays);
            expect(user.lastCheckDate).to.deep.equal(updatedUser.lastCheckDate);
            expect(user.location.coordinates).to.deep.equal(
              updatedUser.location.coordinates
            );
            expect(user.following).to.deep.equal(updatedUser.following);
            expect(user.blockedUsers).to.deep.equal(updatedUser.blockedUsers);
            expect(user.receivedGiftRankings).to.deep.equal(
              updatedUser.receivedGiftRankings
            );
            expect(user.online).to.equal(updatedUser.online);
            done();
          });
        });
    });
  });
});
