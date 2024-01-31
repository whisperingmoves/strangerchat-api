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
const { it, beforeEach, describe } = require("mocha");
const app = require("../../app");
const Gift = require("../../models/Gift");
const User = require("../../models/User");
const GiftHistory = require("../../models/GiftHistory");
const { expect } = require("chai");
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("Gifts API", () => {
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

  describe("GET /gifts", () => {
    beforeEach(async () => {
      // 每次测试前创建10个礼物
      for (let i = 0; i < 10; i++) {
        await Gift.create({
          image: `/gifts/gift${i + 1}.png`,
          name: `礼物${i + 1}`,
          value: (i + 1) * 100,
        });
      }
    });

    it("should get gift list", (done) => {
      chai
        .request(app)
        .get("/gifts")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array").that.has.lengthOf(10);

          res.body.forEach((gift) => {
            gift.should.have.property("id");
            gift.should.have.property("image");
            gift.should.have.property("name");
            gift.should.have.property("value");

            gift.id.should.be.a("string");
            gift.image.should.be.a("string");
            gift.name.should.be.a("string");
            gift.value.should.be.a("number").that.is.within(100, 1000);
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/gifts")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("POST /gifts/send", () => {
    let receiver, gift1, gift2, gift3;

    beforeEach(async () => {
      // 创建测试接收礼物用户
      receiver = await User.create({
        mobile: generateMobile(),
        gender: "female",
        birthday: new Date("1995-01-01"),
        avatar: "avatar.png",
        giftsReceived: 0,
        username: "receiver",
        city: "Shanghai",
        followingCount: 0,
        followersCount: 0,
        visitorsCount: 0,
        freeHeatsLeft: 3,
        coinBalance: 1000,
        checkedDays: 0,
        lastCheckDate: null,
        location: {
          type: "Point",
          coordinates: [121.4737, 31.2304],
        },
        following: [],
      });

      // 创建三个测试礼物
      gift1 = await Gift.create({
        image: "/gifts/gift1.png",
        name: "礼物1",
        value: 100,
      });
      gift2 = await Gift.create({
        image: "/gifts/gift2.png",
        name: "礼物2",
        value: 200,
      });
      gift3 = await Gift.create({
        image: "/gifts/gift3.png",
        name: "礼物3",
        value: 300,
      });
    });

    it("should send gift successfully", (done) => {
      // 为测试送礼用户增加金币余额
      User.updateOne({ _id: userId }, { $set: { coinBalance: 1000 } })
        .then(() => {
          chai
            .request(app)
            .post("/gifts/send")
            .set("Authorization", `Bearer ${token}`)
            .send({
              receiverId: receiver.id,
              giftId: gift1.id,
              quantity: 3,
            })
            .end(async (err, res) => {
              res.should.have.status(200);

              // 检查金币余额是否正确扣减
              const updatedSender = await User.findById(userId);
              expect(updatedSender.coinBalance).to.equal(700);

              // 检查接收礼物用户的礼物数是否增加
              const updatedReceiver = await User.findById(receiver.id);
              expect(updatedReceiver.giftsReceived).to.equal(3);

              done();
            });
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should return 400 if sender has insufficient coins", (done) => {
      chai
        .request(app)
        .post("/gifts/send")
        .set("Authorization", `Bearer ${token}`)
        .send({
          receiverId: receiver.id,
          giftId: gift2.id,
          quantity: 5,
        })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it("should return 404 if receiver does not exist", (done) => {
      chai
        .request(app)
        .post("/gifts/send")
        .set("Authorization", `Bearer ${token}`)
        .send({
          receiverId: "non-existent-user",
          giftId: gift3.id,
          quantity: 1,
        })
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should return 404 if gift does not exist", (done) => {
      chai
        .request(app)
        .post("/gifts/send")
        .set("Authorization", `Bearer ${token}`)
        .send({
          receiverId: receiver.id,
          giftId: "non-existent-gift",
          quantity: 1,
        })
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .post("/gifts/send")
        .send({
          receiverId: receiver.id,
          giftId: gift1.id,
          quantity: 1,
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /users/me/gifts/received", () => {
    let sender1, gift1;

    beforeEach(async () => {
      // 创建测试送礼用户1
      sender1 = await User.create({
        mobile: generateMobile(),
        gender: "male",
        birthday: new Date("1990-01-01"),
        avatar: "avatar1.png",
        giftsSent: 0,
        username: "sender1",
        city: "Shanghai",
        followingCount: 0,
        followersCount: 0,
        visitorsCount: 0,
        freeHeatsLeft: 3,
        coinBalance: 1000,
        checkedDays: 0,
        lastCheckDate: null,
        location: {
          type: "Point",
          coordinates: [121.4737, 31.2304],
        },
        following: [],
      });

      // 创建两个测试礼物
      gift1 = await Gift.create({
        image: "/gifts/gift1.png",
        name: "礼物1",
        value: 100,
      });

      // 为当前登录用户接收礼物
      await User.updateOne({ _id: userId }, { $set: { giftsReceived: 5 } });
    });

    it("should return received gift stats successfully", (done) => {
      // 为测试送礼用户1送礼
      GiftHistory.create({
        sender: sender1.id,
        receiver: userId,
        gift: gift1.id,
        quantity: 5,
      })
        .then(() => {
          chai
            .request(app)
            .get("/users/me/gifts/received")
            .set("Authorization", `Bearer ${token}`)
            .query({ range: 1 })
            .end(async (err, res) => {
              res.should.have.status(200);
              const stats = res.body;
              expect(stats).to.be.an("array").with.lengthOf(1);
              const senderStats = stats[0];
              expect(senderStats.userId).to.equal(sender1.id);
              expect(senderStats.count).to.equal(5);
              expect(senderStats.currentRanking).to.equal(1);
              expect(senderStats.diff).to.equal(0);
              expect(senderStats.username).to.equal(sender1.username);
              expect(senderStats.avatar).to.equal(sender1.avatar);
              done();
            });
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should return empty array if no gifts received", (done) => {
      chai
        .request(app)
        .get("/users/me/gifts/received")
        .set("Authorization", `Bearer ${token}`)
        .query({ range: 0 })
        .end(async (err, res) => {
          res.should.have.status(200);
          const stats = res.body;
          expect(stats).to.be.an("array").with.lengthOf(0);
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/users/me/gifts/received")
        .query({ range: 1 })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });
});
