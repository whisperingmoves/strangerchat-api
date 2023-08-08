const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe } = require("mocha");
const app = require("../../app");
const fs = require("fs");
const path = require("path");

chai.use(chaiHttp);
chai.should();

describe("Uploads API", () => {
  describe("POST /uploadAvatar", () => {
    it("should upload avatar successfully", (done) => {
      const filePath = path.join(__dirname, "test.png");
      chai
        .request(app)
        .post("/uploadAvatar")
        .attach("avatar", fs.createReadStream(filePath), {
          filename: "test.png",
        })
        .then((res) => {
          res.should.have.status(200);
          res.body.should.have.property("url");
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should return 400 if avatar is invalid", (done) => {
      chai
        .request(app)
        .post("/uploadAvatar")
        .send({
          // 无效的头像字段
        })
        .then((res) => {
          res.should.have.status(400);
          res.body.should.have.property("message");
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe("POST /uploadPost", () => {
    it("should upload post image successfully", (done) => {
      const filePath = path.join(__dirname, "test.png");
      chai
        .request(app)
        .post("/uploadPost")
        .attach("post", fs.createReadStream(filePath), { filename: "test.png" })
        .then((res) => {
          res.should.have.status(200);
          res.body.should.have.property("url");
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should return 400 if post image is invalid", (done) => {
      chai
        .request(app)
        .post("/uploadPost")
        .send({
          // 无效的帖子照片字段
        })
        .then((res) => {
          res.should.have.status(400);
          res.body.should.have.property("message");
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
