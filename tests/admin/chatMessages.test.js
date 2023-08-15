const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe, beforeEach } = require("mocha");
const app = require("../../app");
const {
  generateRandomUsername,
  generateStrongPassword,
} = require("../../utils/authUtils");
const bcrypt = require("bcrypt");
const config = require("../../config");
const AdminUser = require("../../models/AdminUser");
const jwt = require("jsonwebtoken");
const { generateMobile } = require("../helper");
const User = require("../../models/User");
const ChatConversation = require("../../models/ChatConversation");
const expect = chai.expect;
chai.use(chaiHttp);

describe("ChatMessages Admin API", () => {
  let adminToken;
  let sender1;
  let recipient1;
  let sender2;
  let recipient2;
  let conversation1;
  let conversation2;

  beforeEach(async () => {
    // 在此处进行管理员用户的登录获取管理员 token 的操作
    // 生成随机的用户名
    const username = generateRandomUsername();

    // 生成高强度密码
    const password = generateStrongPassword();

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash(password, config.saltRounds);
    const adminUser = new AdminUser({
      username: username,
      password: hashedPassword,
    });
    await adminUser.save();

    // 生成管理员用户登录 JWT Token
    adminToken = jwt.sign({ adminId: adminUser.id }, config.jwtAdminSecret);

    // 创建测试用户模型
    sender1 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "sender1",
      city: "City1",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await sender1.save();

    recipient1 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar2.png",
      giftsReceived: 0,
      username: "recipient1",
      city: "City2",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await recipient1.save();

    sender2 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar3.png",
      giftsReceived: 0,
      username: "sender2",
      city: "City3",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await sender2.save();

    recipient2 = new User({
      mobile: generateMobile(),
      gender: "female",
      birthday: new Date(),
      avatar: "/avatars/avatar4.png",
      giftsReceived: 0,
      username: "recipient2",
      city: "City4",
      followingCount: 0,
      followersCount: 0,
      visitorsCount: 0,
      freeHeatsLeft: 3,
      coinBalance: 0,
      checkedDays: 0,
      lastCheckDate: null,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      following: [],
    });
    await recipient2.save();

    // 创建测试会话
    conversation1 = new ChatConversation({
      userId1: sender1.id,
      userId2: recipient1.id,
      lastMessageTime: new Date(),
      lastMessageContent: "你好，今天天气真好！",
    });
    await conversation1.save();

    conversation2 = new ChatConversation({
      userId1: sender2.id,
      userId2: recipient2.id,
      lastMessageTime: new Date(),
      lastMessageContent: "明天有什么计划吗？",
    });
    await conversation2.save();
  });

  describe("POST /admin/chatMessages", () => {
    it("should create a new chat message", (done) => {
      const newChatMessage = {
        conversationId: conversation1.id,
        senderId: sender1.id,
        recipientId: recipient1.id,
        content: "你好，今天天气不错！",
        sentTime: "2023-08-11T10:30:00Z",
        readStatus: 0,
      };

      chai
        .request(app)
        .post("/admin/chatMessages")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newChatMessage)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });
});
