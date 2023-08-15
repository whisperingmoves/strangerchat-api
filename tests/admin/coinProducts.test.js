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
const jwt = require("jsonwebtoken");
const expect = chai.expect;
chai.use(chaiHttp);

describe("CoinProducts Admin API", () => {
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

    describe("POST /admin/coinProducts", () => {
        it("should create a new coin product", (done) => {
            const newCoinProduct = {
                coins: 100,
                originalPrice: 10,
                price: 8,
                currency: "USD",
            };

            chai
                .request(app)
                .post("/admin/coinProducts")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(newCoinProduct)
                .end((err, res) => {
                    expect(res).to.have.status(201);
                    expect(res.body).to.have.property("id");
                    done();
                });
        });
    });
});
