const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe, beforeEach, before } = require("mocha");
const app = require("../../../app");
const {
  generateRandomUsername,
  generateStrongPassword,
} = require("../../../utils/authUtils");
const bcrypt = require("bcrypt");
const config = require("../../../config");
const AdminUser = require("../../../models/AdminUser");
const User = require("../../../models/User");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("Gift Admin API", () => {
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
        birthday: "1990-01-01",
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
        username: "JohnDoe",
      };

      const newUser2 = {
        mobile: generateMobile(),
        username: "JaneSmith",
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
});
