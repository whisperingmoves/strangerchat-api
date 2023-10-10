const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, before, beforeEach, describe } = require("mocha");
const app = require("../../app");
const User = require("../../models/User");
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("Users API", () => {
  let token;
  let userId;
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
    userId = registerResponse.body.userId;
  });

  describe("POST /users/register", () => {
    let mobile;

    beforeEach(() => {
      mobile = generateMobile();
    });

    it("should register successfully", (done) => {
      chai
        .request(app)
        .post("/users/register")
        .send({
          // 发送要求的字段
          mobile,
          gender: "male", // 性别
          birthday: "1990-01-01", //生日
          avatar: "xxxx.jpg", // 头像链接
          longitude: "116.403896", // 经度
          latitude: "39.914772", // 纬度
        })
        .then((res) => {
          res.should.have.status(200);

          res.body.should.have.property("token");
          res.body.should.have.property("userId");

          done();
        });
    });

    it("should return 400 if missing fields", (done) => {
      chai
        .request(app)
        .post("/users/register")
        .send({
          //缺少字段
          gender: "male",
          birthday: "1990-01-01",
        })
        .then((res) => {
          res.should.have.status(400);

          res.body.should.have.property("message");

          done();
        });
    });
  });

  describe("POST /users/:userId/follow", () => {
    let followedUserId;

    beforeEach(async () => {
      // 创建一个测试用户
      const createUserResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "male",
          birthday: "2023-07-30",
          avatar: "avatar.png",
        });

      followedUserId = createUserResponse.body.userId;
    });

    it("should follow user when action is 1", (done) => {
      chai
        .request(app)
        .post(`/users/${followedUserId}/follow?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should unfollow user when action is 0", (done) => {
      // 首先关注用户
      chai
        .request(app)
        .post(`/users/${followedUserId}/follow?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end(() => {
          // 然后取消关注
          chai
            .request(app)
            .post(`/users/${followedUserId}/follow?action=0`)
            .set("Authorization", `Bearer ${token}`)
            .end((err, res) => {
              res.should.have.status(200);
              done();
            });
        });
    });

    it("should return an error when trying to unfollow a user not followed", (done) => {
      chai
        .request(app)
        .post(`/users/${followedUserId}/follow?action=0`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have
            .property("message")
            .equal("用户未被关注，无法取消关注");
          done();
        });
    });
  });

  describe("POST /users/:userId/report", () => {
    let reportedUserId;

    beforeEach(async () => {
      // 创建一个测试用户
      const createUserResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "male",
          birthday: "2023-07-30",
          avatar: "avatar.png",
        });

      reportedUserId = createUserResponse.body.userId;
    });

    it("should report user", (done) => {
      chai
        .request(app)
        .post(`/users/${reportedUserId}/report`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("POST /users/:userId/block", () => {
    let blockedUserId;

    beforeEach(async () => {
      // 创建一个测试用户
      const createUserResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "male",
          birthday: "2023-07-30",
          avatar: "avatar.png",
        });

      blockedUserId = createUserResponse.body.userId;
    });

    it("should block user when action is 1", (done) => {
      chai
        .request(app)
        .post(`/users/${blockedUserId}/block?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should unblock user when action is 0", (done) => {
      // 首先拉黑用户
      chai
        .request(app)
        .post(`/users/${blockedUserId}/block?action=1`)
        .set("Authorization", `Bearer ${token}`)
        .end(() => {
          // 然后取消拉黑
          chai
            .request(app)
            .post(`/users/${blockedUserId}/block?action=0`)
            .set("Authorization", `Bearer ${token}`)
            .end((err, res) => {
              res.should.have.status(200);
              done();
            });
        });
    });

    it("should return an error when trying to unblock a user not blocked", (done) => {
      chai
        .request(app)
        .post(`/users/${blockedUserId}/block?action=0`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have
            .property("message")
            .equal("用户未被拉黑，无法取消拉黑");
          done();
        });
    });
  });

  describe("GET /users/following", () => {
    let userId1;
    let userId2;
    let token1;
    let token2;

    beforeEach(async () => {
      // 创建一个用户名含有"张"的测试用户
      const res1 = await chai.request(app).post("/users/register").send({
        mobile: generateMobile(),
        gender: "male",
        birthday: "2023-07-30",
        avatar: "avatar.png",
      });

      // 保存用户1的userId和token
      userId1 = res1.body.userId;
      token1 = res1.body.token;

      // 创建另一个测试用户
      const res2 = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: "136" + Math.floor(Math.random() * 1000000000),
          gender: "female",
          birthday: "2023-07-30",
          avatar: "avatar.png",
        });

      // 保存用户2的userId和token
      userId2 = res2.body.userId;
      token2 = res2.body.token;

      // 设置用户名
      const user1 = await User.findById(userId1);
      user1.username = "张三";
      await user1.save();

      const user2 = await User.findById(userId2);
      user2.username = "李四";
      await user2.save();

      // 让两个测试用户各发表一篇帖子
      await chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          content: "这是张三发表的一篇帖子",
          city: "北京",
          longitude: "116.4074",
          latitude: "39.9042",
        });

      await chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token2}`)
        .send({
          content: "这是李四发表的一篇帖子",
          city: "上海",
          longitude: "121.4737",
          latitude: "31.2304",
        });

      // 关注两个测试用户
      await chai
        .request(app)
        .post(`/users/${userId1}/follow?action=1`)
        .set("Authorization", `Bearer ${token}`);

      await chai
        .request(app)
        .post(`/users/${userId2}/follow?action=1`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("should return an array of following users", (done) => {
      chai
        .request(app)
        .get("/users/following")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            if (user.hasOwnProperty("username")) {
              user.username.should.be.a("string");
            }
            if (user.hasOwnProperty("latestPostContent")) {
              user.latestPostContent.should.be.a("string");
            }
            if (user.hasOwnProperty("conversationId")) {
              user.conversationId.should.be.a("string");
            }
          });

          done();
        });
    });

    it("should return a limited number of following users", (done) => {
      chai
        .request(app)
        .get("/users/following?page=1&pageSize=2")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array").with.lengthOf(2);

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            user.should.have.property("username").that.is.a("string");
            user.should.have.property("latestPostContent").that.is.a("string");
          });

          done();
        });
    });

    it("should return following users whose username matches the keyword", (done) => {
      chai
        .request(app)
        .get("/users/following?keyword=" + encodeURI("张"))
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            user.should.have
              .property("username")
              .that.is.a("string")
              .that.includes("张");
            user.should.have.property("latestPostContent").that.is.a("string");
          });

          done();
        });
    });
  });

  describe("GET /users/followers", () => {
    let userId1;
    let userId2;
    let token1;
    let token2;

    beforeEach(async () => {
      // 创建一个测试用户
      const res1 = await chai.request(app).post("/users/register").send({
        mobile: generateMobile(),
        gender: "male",
        birthday: "2023-07-30",
        avatar: "avatar.png",
      });

      // 保存用户1的userId和token
      userId1 = res1.body.userId;
      token1 = res1.body.token;

      // 创建另一个测试用户
      const res2 = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: "136" + Math.floor(Math.random() * 1000000000),
          gender: "female",
          birthday: "2023-07-30",
          avatar: "avatar.png",
        });

      // 保存用户2的userId和token
      userId2 = res2.body.userId;
      token2 = res2.body.token;

      // 设置用户名
      const user1 = await User.findById(userId1);
      user1.username = "张三";
      await user1.save();

      const user2 = await User.findById(userId2);
      user2.username = "李四";
      await user2.save();

      // 让两个测试用户各发表一篇帖子
      await chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          content: "这是张三发表的一篇帖子",
          city: "北京",
          longitude: "116.4074",
          latitude: "39.9042",
        });

      await chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token2}`)
        .send({
          content: "这是李四发表的一篇帖子",
          city: "上海",
          longitude: "121.4737",
          latitude: "31.2304",
        });

      // 让两个测试用户关注我
      await chai
        .request(app)
        .post(`/users/${userId}/follow?action=1`)
        .set("Authorization", `Bearer ${token1}`);

      await chai
        .request(app)
        .post(`/users/${userId}/follow?action=1`)
        .set("Authorization", `Bearer ${token2}`);
    });

    it("should return an array of followers", (done) => {
      chai
        .request(app)
        .get("/users/followers")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            if (user.hasOwnProperty("username")) {
              user.username.should.be.a("string");
            }
            if (user.hasOwnProperty("latestPostContent")) {
              user.latestPostContent.should.be.a("string");
            }
            if (user.hasOwnProperty("conversationId")) {
              user.conversationId.should.be.a("string");
            }
          });

          done();
        });
    });

    it("should return a limited number of followers", (done) => {
      chai
        .request(app)
        .get("/users/followers?page=1&pageSize=1")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array").with.lengthOf(1);

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            user.should.have.property("username").that.is.a("string");
            user.should.have.property("latestPostContent").that.is.a("string");
          });

          done();
        });
    });

    it("should return followers whose username matches the keyword", (done) => {
      chai
        .request(app)
        .get("/users/followers?keyword=" + encodeURI("张"))
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            user.should.have
              .property("username")
              .that.is.a("string")
              .that.includes("张");
            user.should.have.property("latestPostContent").that.is.a("string");
          });

          done();
        });
    });
  });

  describe("GET /users/friends", () => {
    let userId1;
    let userId2;
    let token1;
    let token2;

    beforeEach(async () => {
      // 创建一个测试用户
      const res1 = await chai.request(app).post("/users/register").send({
        mobile: generateMobile(),
        gender: "male",
        birthday: "2023-07-30",
        avatar: "avatar.png",
      });

      // 保存用户1的userId和token
      userId1 = res1.body.userId;
      token1 = res1.body.token;

      // 创建另一个测试用户
      const res2 = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: "136" + Math.floor(Math.random() * 1000000000),
          gender: "female",
          birthday: "2023-07-30",
          avatar: "avatar.png",
        });

      // 保存用户2的userId和token
      userId2 = res2.body.userId;
      token2 = res2.body.token;

      // 设置用户名
      const user1 = await User.findById(userId1);
      user1.username = "张三";
      await user1.save();

      const user2 = await User.findById(userId2);
      user2.username = "李四";
      await user2.save();

      // 让两个测试用户各发表一篇帖子
      await chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          content: "这是张三发表的一篇帖子",
          city: "北京",
          longitude: "116.4074",
          latitude: "39.9042",
        });

      await chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${token2}`)
        .send({
          content: "这是李四发表的一篇帖子",
          city: "上海",
          longitude: "121.4737",
          latitude: "31.2304",
        });

      // 让两个测试用户关注我
      await chai
        .request(app)
        .post(`/users/${userId}/follow?action=1`)
        .set("Authorization", `Bearer ${token1}`);

      await chai
        .request(app)
        .post(`/users/${userId}/follow?action=1`)
        .set("Authorization", `Bearer ${token2}`);

      // 关注这两个测试用户
      await chai
        .request(app)
        .post(`/users/${userId1}/follow?action=1`)
        .set("Authorization", `Bearer ${token}`);

      await chai
        .request(app)
        .post(`/users/${userId2}/follow?action=1`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("should return an array of friends", (done) => {
      chai
        .request(app)
        .get("/users/friends")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            if (user.hasOwnProperty("username")) {
              user.username.should.be.a("string");
            }
            if (user.hasOwnProperty("latestPostContent")) {
              user.latestPostContent.should.be.a("string");
            }
            if (user.hasOwnProperty("conversationId")) {
              user.conversationId.should.be.a("string");
            }
          });

          done();
        });
    });

    it("should return a limited number of friends", (done) => {
      chai
        .request(app)
        .get("/users/friends?page=1&pageSize=1")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array").with.lengthOf(1);

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            user.should.have.property("username").that.is.a("string");
            user.should.have.property("latestPostContent").that.is.a("string");
          });

          done();
        });
    });

    it("should return friends whose username matches the keyword", (done) => {
      chai
        .request(app)
        .get("/users/friends?keyword=" + encodeURI("张"))
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("array");

          res.body.forEach((user) => {
            user.should.have.property("userId").that.is.a("string");
            user.should.have
              .property("userAvatar")
              .that.is.a("string")
              .with.length.greaterThan(0);
            user.should.have
              .property("username")
              .that.is.a("string")
              .that.includes("张");
            user.should.have.property("latestPostContent").that.is.a("string");
          });

          done();
        });
    });
  });

  describe("POST /users/checkin/check", () => {
    let checkToken;
    let checkMobile;

    before(async () => {
      // 创建一个测试用户
      checkMobile = generateMobile();
      const res = await chai.request(app).post("/users/register").send({
        mobile: checkMobile,
        gender: "male",
        birthday: "2023-07-30",
        avatar: "avatar.png",
      });

      // 保存用户的token
      checkToken = res.body.token;
    });

    it("should check in successfully and return checked days", (done) => {
      chai
        .request(app)
        .post("/users/checkin/check")
        .set("Authorization", `Bearer ${checkToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("object");
          res.body.should.have
            .property("checkedDays")
            .that.is.a("number")
            .within(0, 7);
          done();
        });
    });

    it("should reset checked days after seven consecutive check-ins", async () => {
      let user = await User.findOne({ mobile: checkMobile });
      user.checkedDays = 6;
      user.lastCheckDate = new Date(new Date().getTime() - 86400000);
      user.lastCheckDate.setHours(0, 0, 0, 0);
      await user.save();

      chai
        .request(app)
        .post("/users/checkin/check")
        .set("Authorization", `Bearer ${checkToken}`)
        .end(async (err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("object");
          res.body.should.have.property("checkedDays").that.is.equal(0);

          // 检查数据库中的连续签到天数和上次签到日期是否已经重置
          user = await User.findOne({ mobile: checkMobile });
          user.checkedDays.should.be.equal(0);
          // 获取当前日期
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          user.lastCheckDate.should.eql(today);
        });
    });

    it("should give correct coin rewards for consecutive check-ins", async () => {
      let user = await User.findOne({ mobile: checkMobile });
      user.checkedDays = 5;
      user.coinBalance = 100;
      user.lastCheckDate = new Date(new Date().getTime() - 86400000);
      user.lastCheckDate.setHours(0, 0, 0, 0);
      await user.save();

      chai
        .request(app)
        .post("/users/checkin/check")
        .set("Authorization", `Bearer ${checkToken}`)
        .end(async (err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("object");
          res.body.should.have.property("checkedDays").that.is.equal(6);

          // 检查数据库中的连续签到天数和金币余额是否更新正确
          user = await User.findOne({ mobile: checkMobile });
          user.checkedDays.should.be.equal(6);
          user.coinBalance.should.be.equal(200);
        });
    });
  });

  describe("PATCH /users/profile", () => {
    it("should update user profile", async () => {
      const res = await chai
        .request(app)
        .patch("/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          avatar: "new_avatar.png",
          username: "John Doe",
          city: "New York",
          longitude: "40.7128",
          latitude: "-74.0060",
        });

      res.should.have.status(200);

      const updatedUser = await User.findById(userId);

      updatedUser.avatar.should.equal("new_avatar.png");
      updatedUser.username.should.equal("John Doe");
      updatedUser.city.should.equal("New York");
      updatedUser.location.coordinates[0].should.equal(40.7128);
      updatedUser.location.coordinates[1].should.equal(-74.006);
    });

    it("should ignore empty fields", async () => {
      const res = await chai
        .request(app)
        .patch("/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      res.should.have.status(200);

      const updatedUser = await User.findById(userId);

      updatedUser.avatar.should.equal("avatar.png");
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await chai.request(app).patch("/users/profile").send({
        avatar: "new_avatar.png",
        username: "John Doe",
        city: "New York",
        longitude: "40.7128",
        latitude: "-74.0060",
      });

      res.should.have.status(401);
      res.body.should.have.property("message").that.equals("请先登录");
    });
  });

  describe("GET /users/:userId", () => {
    let otherUserId;
    let otherToken;

    before(async () => {
      // 创建一个测试用户
      const createUserResponse = await chai
        .request(app)
        .post("/users/register")
        .send({
          mobile: generateMobile(),
          gender: "male",
          birthday: "2000-01-01",
          avatar: "https://example.com/avatar.png",
        });

      otherUserId = createUserResponse.body.userId;
      otherToken = createUserResponse.body.token;

      // 修改用户资料设置用户名和城市
      await chai
        .request(app)
        .patch("/users/profile")
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          username: "testUser",
          city: "New York",
        });
    });

    it("should get user details", (done) => {
      chai
        .request(app)
        .get(`/users/${otherUserId}`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("avatar");
          res.body.should.have.property("username", "testUser");
          res.body.should.have.property("city");
          res.body.should.have.property("followingCount");
          res.body.should.have.property("followersCount");

          done();
        });
    });

    it("should return 404 if user does not exist", (done) => {
      chai
        .request(app)
        .get("/users/nonExistentUserId")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should return 404 if userId is invalid", (done) => {
      chai
        .request(app)
        .get("/users/invalidUserId")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });
});
