const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe, beforeEach } = require("mocha");
const app = require("../../app");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const {
  generateRandomUsername,
  generateStrongPassword,
} = require("../../utils/authUtils");
const bcrypt = require("bcrypt");
const AdminUser = require("../../models/AdminUser");

chai.use(chaiHttp);
chai.should();

describe("Bundles Admin API", () => {
  let url = "test.bundle";
  let publishBundleToken;
  let adminToken;

  beforeEach(async () => {
    // 生成发布Bundle专用 JWT Token
    publishBundleToken = jwt.sign(
      { publishBundleKey: config.publishBundleKey },
      config.jwtPublishBundleSecret
    );

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

  describe("POST /admin/bundles/{bundleId}/online", () => {
    it("should bring a bundle online", (done) => {
      chai
        .request(app)
        .post("/bundles/publish")
        .set("Authorization", `Bearer ${publishBundleToken}`) // 使用 JWT 认证
        .send({
          url,
          version: "1.0.0",
        })
        .then((res) => {
          res.should.have.status(200);

          res.body.should.have.property("bundleId");
          res.body.bundleId.should.be.a("string");

          const bundleId = res.body.bundleId;

          chai
            .request(app)
            .post(`/admin/bundles/${bundleId}/online`)
            .set("Authorization", `Bearer ${adminToken}`) // 使用 JWT 认证
            .then((res) => {
              res.should.have.status(200);

              // 尝试未授权访问
              chai
                .request(app)
                .post(`/admin/bundles/${bundleId}/online`)
                .then((res) => {
                  res.should.have.status(401);
                  done();
                })
                .catch((err) => {
                  done(err);
                });
            })
            .catch((err) => {
              done(err);
            });
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
