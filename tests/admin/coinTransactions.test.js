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
const User = require("../../models/User");
const CoinTransaction = require("../../models/CoinTransaction");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("CoinTransactions Admin API", () => {
  let adminToken;
  let user;

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
    user = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "sender1",
      city: "City1",
    });
    await user.save();
  });

  describe("POST /admin/coinTransactions", () => {
    it("should create a new coin transaction", (done) => {
      const newCoinTransaction = {
        userId: user.id,
        coins: 100,
        amount: 9.99,
        currency: "USD",
        paymentMethod: "Credit Card",
        transactionId: "1234567890",
      };

      chai
        .request(app)
        .post("/admin/coinTransactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newCoinTransaction)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/coinTransactions", () => {
    let coinTransactionIds; // 用于存储金币交易记录的ID

    beforeEach(async () => {
      // 创建两个金币交易记录并获取它们的ID
      const coinTransaction1 = new CoinTransaction({
        userId: user.id,
        coins: 100,
        amount: 10,
        currency: "USD",
        paymentMethod: "Credit Card",
        transactionId: "1234567890",
      });
      await coinTransaction1.save();

      const coinTransaction2 = new CoinTransaction({
        userId: user.id,
        coins: 200,
        amount: 20,
        currency: "USD",
        paymentMethod: "PayPal",
        transactionId: "0987654321",
      });
      await coinTransaction2.save();

      coinTransactionIds = [coinTransaction1.id, coinTransaction2.id];
    });

    it("should delete coin transactions and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/coinTransactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: coinTransactionIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedCoinTransactions = await CoinTransaction.find({
              _id: { $in: coinTransactionIds },
            });
            expect(deletedCoinTransactions).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });
});
