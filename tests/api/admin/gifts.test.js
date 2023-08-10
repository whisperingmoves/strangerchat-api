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
const Gift = require("../../../models/Gift");
const jwt = require("jsonwebtoken");
const expect = chai.expect;
chai.use(chaiHttp);

describe("Gifts Admin API", () => {
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

  describe("POST /admin/gifts", () => {
    it("should create a new gift", (done) => {
      const newGift = {
        image: "/order/gift001.png",
        name: "热气球",
        value: 100,
      };

      chai
        .request(app)
        .post("/admin/gifts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGift)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/gifts", () => {
    let giftIds;

    before((done) => {
      const newGift1 = {
        image: "/order/gift001.png",
        name: "热气球",
        value: 100,
      };

      const newGift2 = {
        image: "/order/gift002.png",
        name: "彩虹糖",
        value: 50,
      };

      chai
        .request(app)
        .post("/admin/gifts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGift1)
        .end((err, res) => {
          expect(res).to.have.status(201);
          const giftId1 = res.body.id;

          chai
            .request(app)
            .post("/admin/gifts")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newGift2)
            .end((err, res) => {
              expect(res).to.have.status(201);
              const giftId2 = res.body.id;

              giftIds = [giftId1, giftId2];
              done();
            });
        });
    });

    it("should delete gifts", (done) => {
      chai
        .request(app)
        .delete("/admin/gifts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: giftIds })
        .end((err, res) => {
          expect(res).to.have.status(204);

          // 验证删除是否成功
          Gift.find({ _id: { $in: giftIds } }, (err, gifts) => {
            expect(gifts).to.have.lengthOf(0);
            done();
          });
        });
    });
  });

  describe("GET /admin/gifts", () => {
    before((done) => {
      const newGift1 = {
        image: "/order/gift001.png",
        name: "热气球",
        value: 100,
      };

      const newGift2 = {
        image: "/order/gift002.png",
        name: "彩虹糖",
        value: 50,
      };

      chai
        .request(app)
        .post("/admin/gifts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGift1)
        .end((err, res) => {
          expect(res).to.have.status(201);

          chai
            .request(app)
            .post("/admin/gifts")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newGift2)
            .end((err, res) => {
              expect(res).to.have.status(201);

              done();
            });
        });
    });

    it("should get a paginated list of gifts", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/gifts")
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

    it("should filter gifts by keyword", (done) => {
      const keyword = "热气球";

      chai
        .request(app)
        .get("/admin/gifts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ keyword })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items).to.have.lengthOf.above(1);
          expect(res.body.items[0].name).to.equal(keyword);
          done();
        });
    });

    it("should sort gifts by name in ascending order", (done) => {
      const sort = "name";
      const order = "asc";

      chai
        .request(app)
        .get("/admin/gifts")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort((a, b) => a.name.localeCompare(b.name));

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });
  });

  describe("PUT /admin/gifts/:giftId", () => {
    let giftId;

    before((done) => {
      // 新增礼物
      const newGift = {
        image: "/order/gift001.png",
        name: "热气球",
        value: 100,
      };

      chai
        .request(app)
        .post("/admin/gifts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGift)
        .end((err, res) => {
          expect(res).to.have.status(201);
          giftId = res.body.id; // 保存新增礼物的ID
          done();
        });
    });

    it("should update a gift", (done) => {
      const updatedGift = {
        image: "/order/gift002.png",
        name: "新热气球",
        value: 200,
      };

      chai
        .request(app)
        .put(`/admin/gifts/${giftId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedGift)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          Gift.findById(giftId, (err, gift) => {
            expect(gift.image).to.equal(updatedGift.image);
            expect(gift.name).to.equal(updatedGift.name);
            expect(gift.value).to.equal(updatedGift.value);
            done();
          });
        });
    });
  });
});
