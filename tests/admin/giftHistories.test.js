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
const Gift = require("../../models/Gift");
const GiftHistory = require("../../models/GiftHistory");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const expect = chai.expect;
chai.use(chaiHttp);

describe("Gift Histories Admin API", () => {
  let adminToken;
  let sender1;
  let receiver1;
  let gift1;
  let sender2;
  let receiver2;
  let gift2;

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

    // 创建用户模型
    sender1 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "sender1",
      city: "City1",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await sender1.save();

    receiver1 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar2.png",
      giftsReceived: 0,
      username: "receiver1",
      city: "City2",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await receiver1.save();

    sender2 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar3.png",
      giftsReceived: 0,
      username: "sender2",
      city: "City3",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await sender2.save();

    receiver2 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar4.png",
      giftsReceived: 0,
      username: "receiver2",
      city: "City4",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await receiver2.save();

    // 创建礼物模型
    gift1 = new Gift({
      image: "/gifts/gift1.png",
      name: "Gift 1",
      value: 50,
    });
    await gift1.save();

    gift2 = new Gift({
      image: "/gifts/gift2.png",
      name: "Gift 2",
      value: 100,
    });
    await gift2.save();
  });

  describe("POST /admin/giftHistories", () => {
    it("should create a new gift history", (done) => {
      const newGiftHistory = {
        sender: sender1.id,
        receiver: receiver1.id,
        gift: gift1.id,
        quantity: 3,
      };

      chai
        .request(app)
        .post("/admin/giftHistories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newGiftHistory)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/giftHistories", () => {
    let giftHistoryIds; // 用于存储礼物历史记录的ID

    beforeEach(async () => {
      // 创建两个礼物历史模型并获取它们的ID
      const giftHistory1 = new GiftHistory({
        sender: sender1.id,
        receiver: receiver1.id,
        gift: gift1.id,
        quantity: 3,
      });
      await giftHistory1.save();

      const giftHistory2 = new GiftHistory({
        sender: sender2.id,
        receiver: receiver2.id,
        gift: gift2.id,
        quantity: 2,
      });
      await giftHistory2.save();

      giftHistoryIds = [giftHistory1.id, giftHistory2.id];
    });

    it("should delete gift histories and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/giftHistories")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: giftHistoryIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedGiftHistories = await GiftHistory.find({
              _id: { $in: giftHistoryIds },
            });
            expect(deletedGiftHistories).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  describe("GET /admin/giftHistories", () => {
    beforeEach(async () => {
      // 创建测试数据
      const giftHistory1 = new GiftHistory({
        sender: sender1.id,
        receiver: receiver1.id,
        gift: gift1.id,
        quantity: 2,
      });
      await giftHistory1.save();

      const giftHistory2 = new GiftHistory({
        sender: sender2.id,
        receiver: receiver2.id,
        gift: gift2.id,
        quantity: 1,
      });
      await giftHistory2.save();
    });

    it("should get a paginated list of gift histories", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/giftHistories")
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

    it("should filter gift histories by senderId", (done) => {
      const senderId = sender1.id; // 替换为实际的发送者ID

      chai
        .request(app)
        .get("/admin/giftHistories")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ senderId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].sender.id).to.equal(senderId);
          done();
        });
    });

    it("should filter gift histories by receiverId", (done) => {
      const receiverId = receiver1.id; // 替换为实际的接收者ID

      chai
        .request(app)
        .get("/admin/giftHistories")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ receiverId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].receiver.id).to.equal(receiverId);
          done();
        });
    });

    it("should sort gift histories by createdAt in descending order", (done) => {
      const sort = "createdAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/giftHistories")
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
