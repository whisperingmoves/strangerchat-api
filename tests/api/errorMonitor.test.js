const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, beforeEach, describe } = require("mocha");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const config = require("../../config");

chai.use(chaiHttp);
chai.should();

describe("Error Monitoring API", () => {
  let monitorToken; // 定义一个全局变量

  beforeEach(() => {
    // 为每一个测试用例生成监控专用 JWT Token
    monitorToken = jwt.sign(
      { monitorKey: config.monitorKey },
      config.jwtMonitorSecret
    );
  });

  describe("POST /monitor/error", () => {
    it("should add an error log", (done) => {
      const errorLog = {
        projectName: "MyProject",
        errorMessage: "An error occurred in the application.",
        stackTrace: "Error stack trace...",
        appVersion: "1.0.0",
        ipAddress: "127.0.0.1",
        runtimeName: "Node.js",
        runtimeVersion: "v14.17.5",
        appStartTime: "2023-08-09T10:00:00Z",
        appMemory: 256,
        browserName: "Chrome",
        browserVersion: "92.0.4515.159",
        locale: "en-US",
        timezone: "GMT+03:00",
        operatingSystemName: "Windows",
        operatingSystemVersion: "10.0.19043",
        occurredFile: "app.js",
        occurredLine: 42,
        occurredFunction: "handleError",
      };

      chai
        .request(app)
        .post("/monitor/error")
        .set("Authorization", `Bearer ${monitorToken}`) // 添加鉴权token
        .send(errorLog)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("错误日志已记录");
          done();
        });
    });

    it("should return 400 if required fields are missing", (done) => {
      const errorLog = {
        projectName: "MyProject",
        stackTrace: "Error stack trace...",
      };

      chai
        .request(app)
        .post("/monitor/error")
        .set("Authorization", `Bearer ${monitorToken}`) // 添加鉴权token
        .send(errorLog)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      const errorLog = {
        projectName: "MyProject",
        errorMessage: "An error occurred in the application.",
        stackTrace: "Error stack trace...",
      };

      chai
        .request(app)
        .post("/monitor/error")
        .send(errorLog)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });
});
