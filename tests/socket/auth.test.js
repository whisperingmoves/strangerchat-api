const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, beforeEach, afterEach, describe } = require("mocha");
const ioClient = require("socket.io-client");
const app = require("../../app");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const User = require("../../models/User");

chai.use(chaiHttp);
chai.should();

describe("Auth Socket", () => {
  let token;
  let socket;
  let mobile;
  let user;

  beforeEach(async () => {
    // 生成随机的手机号
    mobile = "135" + Math.floor(Math.random() * 1000000000);

    // 注册用户并获取 token
    const response = await chai.request(app).post("/users/register").send({
      mobile: mobile,
      gender: "male",
      birthday: "2000-01-01",
      avatar: "avatar.png",
    });

    token = response.body.token;

    // 通过手机号查找用户
    user = await User.findOne({ mobile: mobile });
  });

  it("should connect to WebSocket with valid token", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 监听连接成功事件
    socket.on("connect", async () => {
      // 等待一段时间，以确保在线状态已经更新
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 检查用户的在线状态是否已经设置为 1
      const updatedUser = await User.findById(user._id);
      chai.expect(updatedUser.online).to.equal(1);

      done();
    });
  });

  it("should return error when connecting to WebSocket without token", (done) => {
    // 创建没有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`);

    // 监听连接错误事件
    socket.on("connect_error", (error) => {
      chai.expect(error.message).to.equal("请先登录");
      done();
    });
  });

  it("should return error when connecting to WebSocket with invalid token", (done) => {
    // 生成无效的 token
    const invalidToken = jwt.sign({ userId: "testuser" }, "invalid_secret");

    // 创建带有无效 token 的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: invalidToken,
      },
    });

    // 监听连接错误事件
    socket.on("connect_error", (error) => {
      chai.expect(error.message).to.equal("认证失败");
      done();
    });
  });

  it("should set user online status to 0 when WebSocket disconnected", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 监听连接成功事件
    socket.on("connect", async () => {
      // 断开 WebSocket 连接
      socket.disconnect();

      // 等待一段时间，以确保在线状态已经更新
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 检查用户的在线状态是否已经设置为 0
      const updatedUser = await User.findById(user._id);
      chai.expect(updatedUser.online).to.equal(0);

      done();
    });
  });

  afterEach(async () => {
    // 关闭 WebSocket 连接
    if (socket.connected) {
      socket.disconnect();
    }

    // 删除测试用户
    await User.deleteOne({ mobile: mobile });
  });
});
