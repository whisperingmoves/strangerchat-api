const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, beforeEach, describe } = require("mocha");
const app = require("../../app");

chai.use(chaiHttp);
chai.should();

describe("Stories API", () => {
  let token;
  let mobile;

  beforeEach(async () => {
    // 生成随机的手机号
    mobile = "135" + Math.floor(Math.random() * 1000000000);

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
