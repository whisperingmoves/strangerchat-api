const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe, beforeEach, before } = require("mocha");
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

describe("ChatConversations Admin API", () => {
  let adminToken;
  let caller1;
  let recipient1;
  let caller2;
  let recipient2;

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
    caller1 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar1.png",
      giftsReceived: 0,
      username: "caller1",
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
    await caller1.save();

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

    caller2 = new User({
      mobile: generateMobile(),
      gender: "male",
      birthday: new Date(),
      avatar: "/avatars/avatar3.png",
      giftsReceived: 0,
      username: "caller2",
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
    await caller2.save();

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
  });

  describe("POST /admin/chatConversations", () => {
    it("should create a new chat conversation", (done) => {
      const newChatConversation = {
        userId1: caller1.id,
        userId2: recipient1.id,
        lastMessageTime: "2023-08-11T10:30:00Z",
        lastMessageContent: "Hello, how are you?",
      };

      chai
        .request(app)
        .post("/admin/chatConversations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newChatConversation)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/chatConversations", () => {
    let chatConversationIds;

    before((done) => {
      const newConversation1 = {
        userId1: caller1.id,
        userId2: recipient1.id,
      };

      const newConversation2 = {
        userId1: caller2.id,
        userId2: recipient2.id,
      };

      ChatConversation.create(
        [newConversation1, newConversation2],
        (err, conversations) => {
          chatConversationIds = conversations.map((conversation) =>
            conversation._id.toHexString()
          );
          done();
        }
      );
    });

    it("should delete chat conversations", (done) => {
      chai
        .request(app)
        .delete("/admin/chatConversations")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: chatConversationIds })
        .end((err, res) => {
          expect(res).to.have.status(204);

          // 验证删除是否成功
          ChatConversation.find(
            { _id: { $in: chatConversationIds } },
            (err, conversations) => {
              expect(conversations).to.have.lengthOf(0);
              done();
            }
          );
        });
    });
  });
});
