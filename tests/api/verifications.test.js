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
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("Verifications API", () => {
  describe("POST /verifications/sendCode", () => {
    let mobile;

    beforeEach(() => {
      mobile = generateMobile();
    });

    it("should send code successfully", (done) => {
      chai
        .request(app)
        .post("/verifications/sendCode")
        .send({ mobile: mobile })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("POST /verifications/verifyCode", () => {
    let mobile;

    beforeEach(() => {
      mobile = generateMobile();
    });

    let code;

    beforeEach((done) => {
      // 在每个测试用例前发送验证码
      chai
        .request(app)
        .post("/verifications/sendCode")
        .send({ mobile: mobile })
        .end((err, res) => {
          code = res.body.code;
          done();
        });
    });

    it("should return user info when verified", (done) => {
      // 先调用注册接口,然后使用已注册的手机号测试

      chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: mobile,
          gender: "male",
          birthday: "2023-07-30",
          avatar: "avatar.png",
        })
        .then(() => {
          // 再使用已注册的手机号来测试验证接口

          chai
            .request(app)
            .post("/verifications/verifyCode")
            .send({
              mobile: mobile,
              code: code,
              language: "en", // 语言代码
            })
            .then((res) => {
              res.should.have.status(200);

              res.body.should.have.property("token");
              res.body.should.have.property("userId");
              res.body.should.have.property("gender");
              res.body.should.have.property("birthday");
              res.body.should.have.property("avatar");

              res.body.token.should.be.a("string");
              res.body.userId.should.be.a("string");
              res.body.gender.should.be
                .a("string")
                .to.be.oneOf(["male", "female"]);
              res.body.birthday.should.be
                .a("string")
                .to.match(/^\d{4}-\d{2}-\d{2}$/);
              res.body.avatar.should.be.a("string");

              // 验证可能不返回的字段
              if (res.body.hasOwnProperty("checkedDays")) {
                res.body.checkedDays.should.be.a("number").to.be.within(0, 7);
              }
              if (res.body.hasOwnProperty("lastCheckDate")) {
                res.body.lastCheckDate.should.be.a("number");
              }

              // 验证其他可能不返回的字段
              if (res.body.hasOwnProperty("giftsReceived")) {
                res.body.giftsReceived.should.be.a("number");
              }
              if (res.body.hasOwnProperty("username")) {
                res.body.username.should.be.a("string");
              }
              if (res.body.hasOwnProperty("city")) {
                res.body.city.should.be.a("string");
              }
              if (res.body.hasOwnProperty("followingCount")) {
                res.body.followingCount.should.be.a("number");
              }
              if (res.body.hasOwnProperty("followersCount")) {
                res.body.followersCount.should.be.a("number");
              }
              if (res.body.hasOwnProperty("visitorsCount")) {
                res.body.visitorsCount.should.be.a("number");
              }
              if (res.body.hasOwnProperty("freeHeatsLeft")) {
                res.body.freeHeatsLeft.should.be.a("number");
              }
              if (res.body.hasOwnProperty("coinBalance")) {
                res.body.coinBalance.should.be.a("number");
              }

              done();
            });
        });
    });

    it("should return 201 when unregisted", (done) => {
      chai
        .request(app)
        .post("/verifications/verifyCode")
        .send({
          mobile: mobile, // 使用未注册的手机号
          code: code,
        })
        .then((res) => {
          res.should.have.status(201);
          done();
        });
    });

    it("should return 400 when code is wrong", (done) => {
      // 发送验证码,使用错误的code测试
      chai
        .request(app)
        .post("/verifications/verifyCode")
        .send({
          mobile: mobile,
          code: "wrong-code",
        })
        .then((res) => {
          res.should.have.status(400);
          res.body.should.have.property("message");
          done();
        });
    });
  });
});
