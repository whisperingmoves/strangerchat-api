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

describe("Bundles API", () => {
  let url = "test.bundle";
  let publishBundleToken;
  let refreshBundleToken;
  let adminToken;

  beforeEach(async () => {
    // 生成发布Bundle专用 JWT Token
    publishBundleToken = jwt.sign(
      { publishBundleKey: config.publishBundleKey },
      config.jwtPublishBundleSecret
    );

    // 生成Bundle版本请求专用 JWT Token
    refreshBundleToken = jwt.sign(
      { refreshBundleKey: config.refreshBundleKey },
      config.jwtRefreshBundleSecret
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

  describe("POST /bundles/publish", () => {
    it("should publish a bundle and return bundleId", (done) => {
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

          // 尝试未授权访问
          chai
            .request(app)
            .post("/bundles/publish")
            .send({
              url,
              version: "1.0.0",
            })
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
    });
  });

  describe("GET /bundles/refresh", () => {
    it("should return the URL of the latest online bundle", (done) => {
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

              chai
                .request(app)
                .get("/bundles/refresh")
                .set("Authorization", `Bearer ${refreshBundleToken}`) // 使用 JWT 认证
                .then((res) => {
                  res.should.have.status(200);

                  res.body.should.have.property("url");
                  res.body.url.should.be.a("string");

                  res.body.url.should.be.equal(url);

                  // 尝试未授权访问
                  chai
                    .request(app)
                    .get("/bundles/refresh")
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
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});