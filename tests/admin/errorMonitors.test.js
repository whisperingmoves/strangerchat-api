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
const ErrorMonitor = require("../../models/ErrorMonitor");
const jwt = require("jsonwebtoken");
const expect = chai.expect;
chai.use(chaiHttp);

describe("ErrorMonitors Admin API", () => {
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

  describe("GET /admin/errorMonitors", () => {
    before((done) => {
      // Create error monitors for testing
      const errorMonitor1 = {
        projectName: "MyApp",
        errorMessage: "Unhandled promise rejection",
        stackTrace:
          "Error: Something went wrong\n    at /path/to/promise.js:10:5",
      };

      const errorMonitor2 = {
        projectName: "MyApp",
        errorMessage: "Null pointer exception",
        stackTrace:
          "Error: Null pointer exception\n    at /path/to/file.js:20:10",
      };

      ErrorMonitor.create(errorMonitor1, errorMonitor2)
        .then(() => done())
        .catch((err) => done(err));
    });

    it("should get a paginated list of error monitors", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/errorMonitors")
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

    it("should filter error monitors by projectName", (done) => {
      const projectName = "MyApp";

      chai
        .request(app)
        .get("/admin/errorMonitors")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ projectName })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items).to.have.lengthOf.above(0);
          expect(res.body.items[0].projectName).to.equal(projectName);
          done();
        });
    });

    it("should filter error monitors by keyword", (done) => {
      const keyword = "promise";

      chai
        .request(app)
        .get("/admin/errorMonitors")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ keyword })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items).to.have.lengthOf.above(0);
          expect(res.body.items[0].errorMessage).to.include(keyword);
          expect(res.body.items[0].stackTrace).to.include(keyword);
          done();
        });
    });

    it("should sort error monitors by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/errorMonitors")
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
});
