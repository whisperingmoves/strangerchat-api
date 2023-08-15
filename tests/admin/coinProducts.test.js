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
const CoinProduct = require("../../models/CoinProduct");
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
        coins: (1 + 1) * 100,
        originalPrice: (1 + 1) * 1000,
        price: (1 + 1) * 900,
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

  describe("DELETE /admin/coinProducts", () => {
    let coinProductIds;

    before((done) => {
      const newCoinProduct1 = {
        coins: (2 + 1) * 100,
        originalPrice: (2 + 1) * 1000,
        price: (2 + 1) * 900,
        currency: "USD",
      };

      const newCoinProduct2 = {
        coins: (3 + 1) * 100,
        originalPrice: (3 + 1) * 1000,
        price: (3 + 1) * 900,
        currency: "USD",
      };

      chai
        .request(app)
        .post("/admin/coinProducts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newCoinProduct1)
        .end((err, res) => {
          expect(res).to.have.status(201);
          const coinProductId1 = res.body.id;

          chai
            .request(app)
            .post("/admin/coinProducts")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newCoinProduct2)
            .end((err, res) => {
              expect(res).to.have.status(201);
              const coinProductId2 = res.body.id;

              coinProductIds = [coinProductId1, coinProductId2];
              done();
            });
        });
    });

    it("should delete coin products", (done) => {
      chai
        .request(app)
        .delete("/admin/coinProducts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: coinProductIds })
        .end((err, res) => {
          expect(res).to.have.status(204);

          // 验证删除是否成功
          CoinProduct.find(
            { _id: { $in: coinProductIds } },
            (err, coinProducts) => {
              expect(coinProducts).to.have.lengthOf(0);
              done();
            }
          );
        });
    });
  });

  describe("GET /admin/coinProducts", () => {
    before((done) => {
      const newCoinProduct1 = {
        coins: (4 + 1) * 100,
        originalPrice: (4 + 1) * 1000,
        price: (4 + 1) * 900,
        currency: "USD",
      };

      const newCoinProduct2 = {
        coins: (5 + 1) * 100,
        originalPrice: (5 + 1) * 1000,
        price: (5 + 1) * 900,
        currency: "USD",
      };

      chai
        .request(app)
        .post("/admin/coinProducts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newCoinProduct1)
        .end((err, res) => {
          expect(res).to.have.status(201);

          chai
            .request(app)
            .post("/admin/coinProducts")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newCoinProduct2)
            .end((err, res) => {
              expect(res).to.have.status(201);

              done();
            });
        });
    });

    it("should get a paginated list of coin products", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/coinProducts")
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

    it("should sort coin products by coins in descending order", (done) => {
      const sort = "coins";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/coinProducts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort((a, b) => b.coins - a.coins);

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });
  });

  describe("PUT /admin/coinProducts/:productId", () => {
    let productId;

    before((done) => {
      // 新增金币商品
      const newProduct = {
        coins: (6 + 1) * 100,
        originalPrice: (6 + 1) * 1000,
        price: (6 + 1) * 900,
        currency: "USD",
      };

      chai
        .request(app)
        .post("/admin/coinProducts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newProduct)
        .end((err, res) => {
          expect(res).to.have.status(201);
          productId = res.body.id; // 保存新增金币商品的ID
          done();
        });
    });

    it("should update a coin product", (done) => {
      const updatedProduct = {
        coins: (7 + 1) * 100,
        originalPrice: (7 + 1) * 1000,
        price: (7 + 1) * 900,
        currency: "EUR",
      };

      chai
        .request(app)
        .put(`/admin/coinProducts/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedProduct)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          CoinProduct.findById(productId, (err, product) => {
            expect(product.coins).to.equal(updatedProduct.coins);
            expect(product.originalPrice).to.equal(
              updatedProduct.originalPrice
            );
            expect(product.price).to.equal(updatedProduct.price);
            expect(product.currency).to.equal(updatedProduct.currency);
            done();
          });
        });
    });
  });
});
