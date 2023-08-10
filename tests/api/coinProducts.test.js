const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, beforeEach, describe } = require("mocha");
const app = require("../../app");
const CoinProduct = require("../../models/CoinProduct");
const User = require("../../models/User");
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("CoinProducts API", () => {
  let token;
  let mobile;
  let userId;

  beforeEach(async () => {
    // 生成随机的手机号
    mobile = generateMobile();

    // 注册用户并获取token
    const registerResponse = await chai
      .request(app)
      .post("/users/register")
      .send({
        mobile: mobile,
        gender: "male",
        birthday: "2023-07-30",
        avatar: "avatar.png",
      });

    token = registerResponse.body.token;
    userId = registerResponse.body.userId;
  });

  describe("GET /products/coins", () => {
    beforeEach(async () => {
      // 每次测试前创建10个金币商品
      for (let i = 0; i < 10; i++) {
        await CoinProduct.create({
          coins: (i + 1) * 100,
          originalPrice: (i + 1) * 1000,
          price: (i + 1) * 900,
          currency: "CNY",
        });
      }
    });

    it("should get coin product list", (done) => {
      chai
        .request(app)
        .get("/products/coins")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array").that.has.lengthOf(10);

          res.body.forEach((product) => {
            product.should.have.property("productId");
            product.should.have.property("coins");
            product.should.have.property("originalPrice");
            product.should.have.property("price");
            product.should.have.property("currency");

            product.productId.should.be.a("string");
            product.coins.should.be.a("number").that.is.within(100, 10000);
            product.originalPrice.should.be
              .a("number")
              .that.is.within(1000, 1000000);
            product.price.should.be.a("number").that.is.within(900, 9000);
            product.currency.should.be.a("string").that.matches(/^[A-Z]{3}$/);
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/products/coins")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("POST /products/coins/:id/buy", () => {
    let productId;
    let receipt;

    beforeEach(async () => {
      // 创建一个金币商品
      const product = await CoinProduct.create({
        coins: 100,
        originalPrice: 1000,
        price: 900,
        currency: "CNY",
      });

      productId = product.id;

      // 生成一个随机字符串作为凭据
      receipt = Math.random().toString(36).substr(2, 10);
    });

    it("should buy coin product", async () => {
      // 获取购买前的用户金币余额
      const userBefore = await User.findById(userId);
      const coinsBefore = userBefore.coinBalance;

      // 发送购买请求
      const res = await chai
        .request(app)
        .post(`/products/coins/${productId}/buy`)
        .set("Authorization", `Bearer ${token}`)
        .send({ receipt });

      // 获取购买后的用户金币余额
      const userAfter = await User.findById(userId);
      const coinsAfter = userAfter.coinBalance;

      // 断言购买成功
      res.should.have.status(200);
      res.body.should.have.property("message").that.equals("购买成功");

      // 断言用户金币余额正确变动
      coinsAfter.should.equal(coinsBefore + 100);
    });

    it("should return 400 if receipt is missing", (done) => {
      chai
        .request(app)
        .post(`/products/coins/${productId}/buy`)
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .post(`/products/coins/${productId}/buy`)
        .send({ receipt })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it("should return 404 if product does not exist", (done) => {
      chai
        .request(app)
        .post("/products/coins/invalid-product-id/buy")
        .set("Authorization", `Bearer ${token}`)
        .send({ receipt })
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });
});
