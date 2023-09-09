const chai = require("chai");
const chaiHttp = require("chai-http");
const { beforeEach, it, describe } = require("mocha");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

chai.use(chaiHttp);
chai.should();

describe("Uploads API", () => {
  let uploadToken;

  beforeEach(() => {
    // 生成上传专用 JWT Token
    uploadToken = jwt.sign(
      { uploadKey: config.uploadKey },
      config.jwtUploadSecret
    );
  });

  describe("POST /uploadAvatar", () => {
    it("should upload avatar successfully", (done) => {
      const filePath = path.join(__dirname, "test.png");
      chai
        .request(app)
        .post("/uploadAvatar")
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
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
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
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

    it("should return 401 if JWT token is not provided", (done) => {
      const filePath = path.join(__dirname, "test.png");
      chai
        .request(app)
        .post("/uploadAvatar")
        .attach("avatar", fs.createReadStream(filePath), {
          filename: "test.png",
        })
        .then((res) => {
          res.should.have.status(401);
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
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
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
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
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

    it("should return 401 if JWT token is not provided", (done) => {
      const filePath = path.join(__dirname, "test.png");
      chai
        .request(app)
        .post("/uploadPost")
        .attach("post", fs.createReadStream(filePath), { filename: "test.png" })
        .then((res) => {
          res.should.have.status(401);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe("POST /uploadBundle", () => {
    it("should upload Bundle file successfully", (done) => {
      const bundlePath = path.join(__dirname, "test.bundle");
      chai
        .request(app)
        .post("/uploadBundle")
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
        .attach("bundle", fs.createReadStream(bundlePath), {
          filename: "test.bundle",
        })
        .then((res) => {
          res.should.have.status(200);
          res.body.should.have.property("url");
          const urlParts = res.body.url.split("/");
          const uploadedFilename = urlParts[urlParts.length - 1];
          uploadedFilename.should.equal("test.bundle");
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should return 400 if Bundle file is invalid", (done) => {
      chai
        .request(app)
        .post("/uploadBundle")
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
        .send({
          // 无效的 Bundle 文件字段
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

    it("should return 401 if JWT token is not provided", (done) => {
      const bundlePath = path.join(__dirname, "test.bundle");
      chai
        .request(app)
        .post("/uploadBundle")
        .attach("bundle", fs.createReadStream(bundlePath), {
          filename: "test.bundle",
        })
        .then((res) => {
          res.should.have.status(401);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe("POST /uploadMessage", () => {
    it("should upload message image successfully", (done) => {
      const filePath = path.join(__dirname, "test.png");
      chai
        .request(app)
        .post("/uploadMessage")
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
        .attach("message", fs.createReadStream(filePath), {
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

    it("should return 400 if message image is invalid", (done) => {
      chai
        .request(app)
        .post("/uploadMessage")
        .set("Authorization", `Bearer ${uploadToken}`) // 使用 JWT 认证
        .send({
          // 无效的消息图片字段
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

    it("should return 401 if JWT token is not provided", (done) => {
      const filePath = path.join(__dirname, "test.png");
      chai
        .request(app)
        .post("/uploadMessage")
        .attach("message", fs.createReadStream(filePath), {
          filename: "test.png",
        })
        .then((res) => {
          res.should.have.status(401);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
