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

describe("Stories API", () => {
  let token;
  let mobile;

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
  });

  describe("GET /stories", () => {
    it("should get story list", (done) => {
      chai
        .request(app)
        .get("/stories")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((story) => {
            story.should.have.property("userId");
            story.should.have.property("avatar");
            story.should.have.property("createTime");

            story.userId.should.be.a("string");
            story.avatar.should.be.a("string");
            story.createTime.should.be.a("number");

            if (story.hasOwnProperty("username")) {
              story.username.should.be.a("string");
            }

            if (story.hasOwnProperty("relation")) {
              story.relation.should.be.within(0, 3);
            }

            if (story.hasOwnProperty("firstImage")) {
              story.firstImage.should.be.a("string");
            }

            if (story.hasOwnProperty("online")) {
              story.online.should.be.within(0, 1);
            }
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/stories")
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });
});
