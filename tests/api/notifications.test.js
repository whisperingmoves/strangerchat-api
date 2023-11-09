const chai = require("chai");
const chaiHttp = require("chai-http");
const { beforeEach, describe, it, before } = require("mocha");
const app = require("../../app");
const StatusNotification = require("../../models/StatusNotification");
const GiftNotification = require("../../models/GiftNotification");
const SystemNotification = require("../../models/SystemNotification");
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("Notifications API", () => {
  let token;
  let userId;
  let mobile;
  let postId;

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

    // 创建一个测试帖子
    const createPostResponse = await chai
      .request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        content: "Test post",
        city: "北京",
        longitude: "116.4074",
        latitude: "39.9042",
        images: ["/uploads/xxx1.png", "/uploads/xxx2.png"],
        visibility: 0,
      });

    postId = createPostResponse.body.postId;
  });

  describe("GET /notifications/interaction", () => {
    it("should get like notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/interaction")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, interactionType: 0 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("interactionType");
            notification.should.have.property("interactionTime");
            notification.should.have.property("postId");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            if (notification.hasOwnProperty("postImage")) {
              notification.postImage.should.be.a("string");
            }

            notification.interactionType.should.equal(0);
            notification.interactionTime.should.be.a("number");
            notification.postId.should.should.be.a("string");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should get comment notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/interaction")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, interactionType: 1 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("interactionType");
            notification.should.have.property("interactionTime");
            notification.should.have.property("postId");
            notification.should.have.property("commentId");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            if (notification.hasOwnProperty("postImage")) {
              notification.postImage.should.be.a("string");
            }

            notification.interactionType.should.equal(1);
            notification.interactionTime.should.be.a("number");
            notification.postId.should.should.be.a("string");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should get share notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/interaction")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, interactionType: 2 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("interactionType");
            notification.should.have.property("interactionTime");
            notification.should.have.property("postId");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            if (notification.hasOwnProperty("postImage")) {
              notification.postImage.should.be.a("string");
            }

            notification.interactionType.should.equal(2);
            notification.interactionTime.should.be.a("number");
            notification.postId.should.should.be.a("string");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should get collect notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/interaction")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, interactionType: 3 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("interactionType");
            notification.should.have.property("interactionTime");
            notification.should.have.property("postId");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            if (notification.hasOwnProperty("postImage")) {
              notification.postImage.should.be.a("string");
            }

            notification.interactionType.should.equal(3);
            notification.interactionTime.should.be.a("number");
            notification.postId.should.should.be.a("string");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should get comment like notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/interaction")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, interactionType: 4 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("interactionType");
            notification.should.have.property("interactionTime");
            notification.should.have.property("postId");
            notification.should.have.property("commentId");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            if (notification.hasOwnProperty("postImage")) {
              notification.postImage.should.be.a("string");
            }

            notification.interactionType.should.equal(4);
            notification.interactionTime.should.be.a("number");
            notification.postId.should.should.be.a("string");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should get comment reply notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/interaction")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, interactionType: 5 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("interactionType");
            notification.should.have.property("interactionTime");
            notification.should.have.property("postId");
            notification.should.have.property("commentId");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            if (notification.hasOwnProperty("postImage")) {
              notification.postImage.should.be.a("string");
            }

            notification.interactionType.should.equal(5);
            notification.interactionTime.should.be.a("number");
            notification.postId.should.should.be.a("string");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/notifications/interaction")
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("PATCH /notifications/interaction/:notificationId/read", () => {
    let notificationId;
    let notificationToken;
    let otherToken;

    before(async () => {
      // 获取通知用户的token
      notificationToken = token;

      // 获取另一个用户的token
      const registerResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "female",
          birthday: "2000-01-01",
          avatar: "avatar.png",
        });

      otherToken = registerResponse.body.token;

      // 以另一个用户的身份给帖子点赞，产生交互类通知
      const likeResponse = await chai
        .request(app)
        .post(`/posts/${postId}/like?action=1`)
        .set("Authorization", `Bearer ${otherToken}`);

      if (likeResponse.status !== 200) {
        throw new Error("点赞失败");
      }

      // 获取第一个交互类通知的 ID
      const notificationResponse = await chai
        .request(app)
        .get("/notifications/interaction")
        .set("Authorization", `Bearer ${notificationToken}`);

      if (notificationResponse.body.length === 0) {
        throw new Error("没有交互类通知");
      }

      notificationId = notificationResponse.body[0].notificationId;
    });

    it("should mark interaction notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/interaction/${notificationId}/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(200);

          // 检查交互类通知是否被标记为已读
          chai
            .request(app)
            .get("/notifications/interaction")
            .query({ page: 1, pageSize: 10 })
            .set("Authorization", `Bearer ${notificationToken}`)
            .end((err, res) => {
              res.should.have.status(200);
              const notification = res.body.find(
                (n) => n.notificationId === notificationId
              );
              chai.expect(notification.readStatus).to.equal(1);
              done();
            });
        });
    });

    it("should return 404 if interaction notification does not exist", (done) => {
      chai
        .request(app)
        .patch(`/notifications/interaction/123456/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property("message").equal("交互类通知不存在");
          done();
        });
    });

    it("should return 403 if user does not have permission to mark notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/interaction/${notificationId}/read`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have
            .property("message")
            .equal("无权限标记该通知为已读");
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .patch(`/notifications/interaction/${notificationId}/read`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /notifications/status", () => {
    it("should get status notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/status")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("statusType");
            notification.should.have.property("statusTime");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            notification.statusType.should.be.within(0, 1);
            notification.statusTime.should.be.a("number");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/notifications/status")
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("PATCH /notifications/status/:notificationId/read", () => {
    let notificationId;
    let notificationToken;
    let notificationUserId;
    let otherToken;
    let otherUserId;

    before(async () => {
      // 获取通知用户的token和userId
      notificationToken = token;
      notificationUserId = userId;

      // 获取另一个用户的token
      const registerResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "female",
          birthday: "2000-01-01",
          avatar: "avatar.png",
        });

      otherToken = registerResponse.body.token;
      otherUserId = registerResponse.body.userId;

      // 以另一个用户的身份生成状态类通知
      const notification = await StatusNotification.create({
        toUser: notificationUserId,
        user: otherUserId,
        statusType: 0,
      });

      if (!notification) {
        throw new Error("产生状态类通知失败");
      }

      // 获取第一个状态类通知的 ID
      const notificationResponse = await chai
        .request(app)
        .get("/notifications/status")
        .query({ page: 1, pageSize: 10 })
        .set("Authorization", `Bearer ${notificationToken}`);

      if (notificationResponse.body.length === 0) {
        throw new Error("没有状态类通知");
      }

      notificationId = notificationResponse.body[0].notificationId;
    });

    it("should mark status notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/status/${notificationId}/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(200);

          // 检查状态类通知是否被标记为已读
          chai
            .request(app)
            .get("/notifications/status")
            .query({ page: 1, pageSize: 10 })
            .set("Authorization", `Bearer ${notificationToken}`)
            .end((err, res) => {
              res.should.have.status(200);
              const notification = res.body.find(
                (n) => n.notificationId === notificationId
              );
              chai.expect(notification.readStatus).to.equal(1);
              done();
            });
        });
    });

    it("should return 404 if status notification does not exist", (done) => {
      chai
        .request(app)
        .patch(`/notifications/status/123456/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property("message").equal("状态类通知不存在");
          done();
        });
    });

    it("should return 403 if user does not have permission to mark notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/status/${notificationId}/read`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have
            .property("message")
            .equal("无权限标记该通知为已读");
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .patch(`/notifications/status/${notificationId}/read`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /notifications/gift", () => {
    it("should get gift notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/gift")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("userAvatar");
            notification.should.have.property("userId");
            notification.should.have.property("giftQuantity");
            notification.should.have.property("giftName");
            notification.should.have.property("giftTime");

            if (notification.hasOwnProperty("username")) {
              notification.username.should.be.a("string");
            }

            notification.giftQuantity.should.be.a("number");
            notification.giftName.should.be.a("string");
            notification.giftTime.should.be.a("number");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/notifications/gift")
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("PATCH /notifications/gift/:notificationId/read", () => {
    let notificationId;
    let notificationToken;
    let notificationUserId;
    let otherToken;
    let otherUserId;

    before(async () => {
      // 获取通知用户的token和userId
      notificationToken = token;
      notificationUserId = userId;

      // 获取另一个用户的token
      const registerResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "female",
          birthday: "2000-01-01",
          avatar: "avatar.png",
        });

      otherToken = registerResponse.body.token;
      otherUserId = registerResponse.body.userId;

      // 以另一个用户的身份生成礼物类通知
      const notification = await GiftNotification.create({
        toUser: notificationUserId,
        user: otherUserId,
        giftQuantity: 1,
        giftName: "礼物",
      });

      if (!notification) {
        throw new Error("产生礼物类通知失败");
      }

      // 获取第一个礼物类通知的 ID
      const notificationResponse = await chai
        .request(app)
        .get("/notifications/gift")
        .query({ page: 1, pageSize: 10 })
        .set("Authorization", `Bearer ${notificationToken}`);

      if (notificationResponse.body.length === 0) {
        throw new Error("没有礼物类通知");
      }

      notificationId = notificationResponse.body[0].notificationId;
    });

    it("should mark gift notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/gift/${notificationId}/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(200);

          // 检查礼物类通知是否被标记为已读
          chai
            .request(app)
            .get("/notifications/gift")
            .query({ page: 1, pageSize: 10 })
            .set("Authorization", `Bearer ${notificationToken}`)
            .end((err, res) => {
              res.should.have.status(200);
              const notification = res.body.find(
                (n) => n.notificationId === notificationId
              );
              chai.expect(notification.readStatus).to.equal(1);
              done();
            });
        });
    });

    it("should return 404 if gift notification does not exist", (done) => {
      chai
        .request(app)
        .patch(`/notifications/gift/123456/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property("message").equal("礼物类通知不存在");
          done();
        });
    });

    it("should return 403 if user does not have permission to mark gift notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/gift/${notificationId}/read`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have
            .property("message")
            .equal("无权限标记该通知为已读");
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .patch(`/notifications/gift/${notificationId}/read`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("GET /notifications/system", () => {
    it("should get system notifications list", (done) => {
      chai
        .request(app)
        .get("/notifications/system")
        .set("Authorization", `Bearer ${token}`)
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((notification) => {
            notification.should.have.property("notificationId");
            notification.should.have.property("notificationTitle");
            notification.should.have.property("notificationContent");
            notification.should.have.property("notificationTime");
            notification.should.have.property("readStatus");

            notification.notificationId.should.be.a("string");
            notification.notificationTitle.should.be.a("string");
            notification.notificationContent.should.be.a("string");
            notification.notificationTime.should.be.a("number");
            notification.readStatus.should.be.within(0, 1);
          });

          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .get("/notifications/system")
        .query({ page: 1, pageSize: 10 })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe("PATCH /notifications/system/:notificationId/read", () => {
    let notificationId;
    let notificationToken;
    let notificationUserId;
    let otherToken;

    before(async () => {
      // 获取通知用户的token和userId
      notificationToken = token;
      notificationUserId = userId;

      // 获取另一个用户的token
      const registerResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "female",
          birthday: "2000-01-01",
          avatar: "avatar.png",
        });

      otherToken = registerResponse.body.token;

      // 以另一个用户的身份生成系统类通知
      const notification = await SystemNotification.create({
        toUser: notificationUserId,
        notificationTitle: "测试系统类通知",
        notificationContent: "这是一条测试系统类通知",
      });

      if (!notification) {
        throw new Error("产生系统类通知失败");
      }

      // 获取第一个系统类通知的 ID
      const notificationResponse = await chai
        .request(app)
        .get("/notifications/system")
        .query({ page: 1, pageSize: 10 })
        .set("Authorization", `Bearer ${notificationToken}`);

      if (notificationResponse.body.length === 0) {
        throw new Error("没有系统类通知");
      }

      notificationId = notificationResponse.body[0].notificationId;
    });

    it("should mark system notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/system/${notificationId}/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(200);

          // 检查系统类通知是否被标记为已读
          chai
            .request(app)
            .get("/notifications/system")
            .query({ page: 1, pageSize: 10 })
            .set("Authorization", `Bearer ${notificationToken}`)
            .end((err, res) => {
              res.should.have.status(200);
              const notification = res.body.find(
                (n) => n.notificationId === notificationId
              );
              chai.expect(notification.readStatus).to.equal(1);
              done();
            });
        });
    });

    it("should return 404 if system notification does not exist", (done) => {
      chai
        .request(app)
        .patch(`/notifications/system/123456/read`)
        .set("Authorization", `Bearer ${notificationToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property("message").equal("系统类通知不存在");
          done();
        });
    });

    it("should return 403 if user does not have permission to mark system notification as read", (done) => {
      chai
        .request(app)
        .patch(`/notifications/system/${notificationId}/read`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have
            .property("message")
            .equal("无权限标记该通知为已读");
          done();
        });
    });

    it("should return 401 if user is not authenticated", (done) => {
      chai
        .request(app)
        .patch(`/notifications/system/${notificationId}/read`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });
});
