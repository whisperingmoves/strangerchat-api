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
const ChatMessage = require("../../models/ChatMessage");
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

  describe("DELETE /admin/chatMessages", () => {
    let chatMessageIds; // 用于存储聊天消息记录的ID

    beforeEach(async () => {
      // 创建两个聊天消息模型并获取它们的ID
      const chatMessage1 = new ChatMessage({
        conversationId: conversation1.id,
        senderId: sender1.id,
        recipientId: recipient1.id,
        content: "Hello",
      });
      await chatMessage1.save();

      const chatMessage2 = new ChatMessage({
        conversationId: conversation2.id,
        senderId: sender2.id,
        recipientId: recipient2.id,
        content: "Hi",
      });
      await chatMessage2.save();

      chatMessageIds = [chatMessage1.id, chatMessage2.id];
    });

    it("should delete chat messages and verify deletion", (done) => {
      chai
        .request(app)
        .delete("/admin/chatMessages")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: chatMessageIds })
        .end(async (err, res) => {
          try {
            expect(res).to.have.status(204);

            // Verify deletion
            const deletedChatMessages = await ChatMessage.find({
              _id: { $in: chatMessageIds },
            });
            expect(deletedChatMessages).to.be.an("array").that.is.empty;

            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  describe("GET /admin/chatMessages", () => {
    let conversationId;
    let senderId;
    let recipientId;

    beforeEach(async () => {
      conversationId = conversation1.id;
      senderId = sender1.id;
      recipientId = recipient1.id;

      // 创建测试数据
      const chatMessage1 = new ChatMessage({
        conversationId: conversationId,
        senderId: senderId,
        recipientId: recipientId,
        content: "Hello",
      });
      await chatMessage1.save();

      const chatMessage2 = new ChatMessage({
        conversationId: conversationId,
        senderId: recipientId,
        recipientId: senderId,
        content: "Hi",
      });
      await chatMessage2.save();
    });

    it("should get a paginated list of chat messages", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/chatMessages")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page, pageSize })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("page", page);
          expect(res.body).to.have.property("pageSize", pageSize);
          expect(res.body).to.have.property("total");
          expect(res.body).to.have.property("items").to.be.an("array");
          done();
        });
    });

    it("should filter chat messages by conversationId", (done) => {
      chai
        .request(app)
        .get("/admin/chatMessages")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ conversationId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].conversationId).to.equal(conversationId);
          done();
        });
    });

    it("should filter chat messages by senderId", (done) => {
      chai
        .request(app)
        .get("/admin/chatMessages")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ senderId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].sender.id).to.equal(senderId);
          done();
        });
    });

    it("should filter chat messages by recipientId", (done) => {
      chai
        .request(app)
        .get("/admin/chatMessages")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ recipientId })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].recipient.id).to.equal(recipientId);
          done();
        });
    });

    it("should sort chat messages by sentTime in descending order", (done) => {
      const sort = "sentTime";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/chatMessages")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort(
            (a, b) => new Date(b.sentTime) - new Date(a.sentTime)
          );

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });
  });

  describe("PUT /admin/chatMessages/:chatMessageId", () => {
    let chatMessageId;

    before((done) => {
      // 创建聊天消息
      const newChatMessage = {
        conversationId: conversation1.id,
        senderId: sender1.id,
        recipientId: recipient1.id,
        content: "Hello, how are you?",
      };

      ChatMessage.create(newChatMessage, (err, chatMessage) => {
        chatMessageId = chatMessage._id; // 保存新增聊天消息的ID
        done();
      });
    });

    it("should update a chat message", (done) => {
      const updatedChatMessage = {
        conversationId: conversation2.id,
        senderId: sender2.id,
        recipientId: recipient2.id,
        content: "Hi, I'm fine. How about you?",
        readStatus: 1,
        sentTime: new Date("2023-08-15T10:30:00Z"),
      };

      chai
        .request(app)
        .put(`/admin/chatMessages/${chatMessageId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedChatMessage)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          ChatMessage.findById(chatMessageId, (err, chatMessage) => {
            expect(chatMessage.conversationId.toString()).to.equal(
              updatedChatMessage.conversationId
            );
            expect(chatMessage.senderId.toString()).to.equal(
              updatedChatMessage.senderId
            );
            expect(chatMessage.recipientId.toString()).to.equal(
              updatedChatMessage.recipientId
            );
            expect(chatMessage.content).to.equal(updatedChatMessage.content);
            expect(chatMessage.readStatus).to.equal(
              updatedChatMessage.readStatus
            );
            expect(chatMessage.sentTime.toISOString()).to.equal(
              updatedChatMessage.sentTime.toISOString()
            );
            done();
          });
        });
    });
  });
});
