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
const Verification = require("../../models/Verification");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("Verifications Admin API", () => {
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

  describe("POST /admin/verifications", () => {
    it("should create a new verification", (done) => {
      const newVerification = {
        mobile: generateMobile(),
        code: "1234",
      };

      chai
        .request(app)
        .post("/admin/verifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newVerification)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/verifications", () => {
    let verificationIds;

    before((done) => {
      const newVerification1 = {
        mobile: generateMobile(),
        code: "1234",
      };

      const newVerification2 = {
        mobile: generateMobile(),
        code: "5678",
      };

      chai
        .request(app)
        .post("/admin/verifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newVerification1)
        .end((err, res) => {
          expect(res).to.have.status(201);
          const verificationId1 = res.body.id;

          chai
            .request(app)
            .post("/admin/verifications")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newVerification2)
            .end((err, res) => {
              expect(res).to.have.status(201);
              const verificationId2 = res.body.id;

              verificationIds = [verificationId1, verificationId2];
              done();
            });
        });
    });

    it("should delete verifications", (done) => {
      chai
        .request(app)
        .delete("/admin/verifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: verificationIds })
        .end((err, res) => {
          expect(res).to.have.status(204);

          // 验证删除是否成功
          Verification.find(
            { _id: { $in: verificationIds } },
            (err, verifications) => {
              expect(verifications).to.have.lengthOf(0);
              done();
            }
          );
        });
    });
  });

  describe("GET /admin/verifications", () => {
    let mobile1;
    let code1;
    let mobile2;
    let code2;

    beforeEach((done) => {
      mobile1 = generateMobile();
      code1 = "1234";
      const newVerification1 = {
        mobile: mobile1,
        code: code1,
      };

      mobile2 = generateMobile();
      code2 = "5678";
      const newVerification2 = {
        mobile: mobile2,
        code: code2,
      };

      chai
        .request(app)
        .post("/admin/verifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newVerification1)
        .end((err, res) => {
          expect(res).to.have.status(201);

          chai
            .request(app)
            .post("/admin/verifications")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newVerification2)
            .end((err, res) => {
              expect(res).to.have.status(201);

              done();
            });
        });
    });

    it("should get a paginated list of verifications", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/verifications")
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

    it("should filter verifications by keyword", (done) => {
      const keyword = mobile1;

      chai
        .request(app)
        .get("/admin/verifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ keyword })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items).to.have.lengthOf.above(0);
          expect(res.body.items[0].code).to.equal(code1);
          done();
        });
    });

    it("should sort verifications by createdAt in ascending order", (done) => {
      const sort = "createdAt";
      const order = "asc";

      chai
        .request(app)
        .get("/admin/verifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0);
          sortedItems.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });
  });

  describe("PUT /admin/verifications/:verificationId", () => {
    let verificationId;

    before((done) => {
      // 新增验证码
      const newVerification = {
        mobile: generateMobile(),
        code: "123456",
      };

      chai
        .request(app)
        .post("/admin/verifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newVerification)
        .end((err, res) => {
          expect(res).to.have.status(201);
          verificationId = res.body.id; // 保存新增验证码的ID
          done();
        });
    });

    it("should update a verification", (done) => {
      const updatedVerification = {
        code: "654321",
        mobile: generateMobile(),
      };

      chai
        .request(app)
        .put(`/admin/verifications/${verificationId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedVerification)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          Verification.findById(verificationId, (err, verification) => {
            expect(verification.code).to.equal(updatedVerification.code);
            expect(verification.mobile).to.equal(updatedVerification.mobile);
            done();
          });
        });
    });
  });
});
