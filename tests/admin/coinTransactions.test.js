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

  describe("GET /admin/coinTransactions", () => {
    beforeEach(async () => {
      // 创建测试数据
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
        currency: "EUR",
        paymentMethod: "PayPal",
        transactionId: "9876543210",
      });
      await coinTransaction2.save();
    });

    it("should get a paginated list of coin transactions", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/coinTransactions")
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

    it("should filter coin transactions by userId", (done) => {
      const userId = user.id; // 替换为实际的用户ID

      chai
        .request(app)
        .get("/admin/coinTransactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ userId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].user.id).to.equal(userId);
          done();
        });
    });

    it("should filter coin transactions by transactionId", (done) => {
      const transactionId = "1234567890"; // 替换为实际的交易ID

      chai
        .request(app)
        .get("/admin/coinTransactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ transactionId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].transactionId).to.equal(transactionId);
          done();
        });
    });

    it("should sort coin transactions by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/coinTransactions")
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

  describe("PUT /admin/coinTransactions/:transactionId", () => {
    let transactionId;

    before((done) => {
      // 创建金币交易记录
      const newCoinTransaction = {
        userId: user.id,
        coins: 100,
        amount: 10,
        currency: "USD",
        paymentMethod: "Credit Card",
        transactionId: "1234567890",
      };

      CoinTransaction.create(newCoinTransaction, (err, coinTransaction) => {
        transactionId = coinTransaction._id; // 保存新增金币交易记录的ID
        done();
      });
    });

    it("should update a coin transaction", (done) => {
      const updatedCoinTransaction = {
        userId: user.id,
        coins: 200,
        amount: 20,
        currency: "EUR",
        paymentMethod: "PayPal",
        transactionId: "0987654321",
      };

      chai
        .request(app)
        .put(`/admin/coinTransactions/${transactionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedCoinTransaction)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          CoinTransaction.findById(transactionId, (err, coinTransaction) => {
            expect(coinTransaction.userId.toString()).to.equal(
              updatedCoinTransaction.userId
            );
            expect(coinTransaction.coins).to.equal(
              updatedCoinTransaction.coins
            );
            expect(coinTransaction.amount).to.equal(
              updatedCoinTransaction.amount
            );
            expect(coinTransaction.currency).to.equal(
              updatedCoinTransaction.currency
            );
            expect(coinTransaction.paymentMethod).to.equal(
              updatedCoinTransaction.paymentMethod
            );
            expect(coinTransaction.transactionId).to.equal(
              updatedCoinTransaction.transactionId
            );
            done();
          });
        });
    });
  });
});
