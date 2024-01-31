// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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

    it("should delete associated chat messages when deleting chat conversations", (done) => {
      // 创建一个聊天会话
      const newConversation = {
        userId1: caller1.id,
        userId2: recipient1.id,
      };

      ChatConversation.create(newConversation, (err, conversation) => {
        // 创建关联的聊天消息
        const message1 = {
          conversationId: conversation._id,
          senderId: caller1.id,
          recipientId: recipient1.id,
          content: "Hello",
        };

        const message2 = {
          conversationId: conversation._id,
          senderId: recipient1.id,
          recipientId: caller1.id,
          content: "Hi",
        };

        ChatMessage.create([message1, message2], (err, messages) => {
          const chatMessageIds = messages.map((message) =>
            message._id.toHexString()
          );

          // 删除聊天会话
          chai
            .request(app)
            .delete("/admin/chatConversations")
            .set("Authorization", `Bearer ${adminToken}`)
            .query({ ids: [conversation._id.toHexString()] })
            .end((err, res) => {
              expect(res).to.have.status(204);

              // 验证关联的聊天消息是否被删除
              ChatMessage.find(
                { _id: { $in: chatMessageIds } },
                (err, messages) => {
                  expect(messages).to.have.lengthOf(0);
                  done();
                }
              );
            });
        });
      });
    });
  });

  describe("GET /admin/chatConversations", () => {
    beforeEach(async () => {
      // 创建测试数据
      const conversation1 = new ChatConversation({
        userId1: caller1.id,
        userId2: recipient1.id,
        lastMessageTime: new Date(),
        lastMessageContent: "你好，今天天气真好！",
      });
      await conversation1.save();

      const conversation2 = new ChatConversation({
        userId1: caller2.id,
        userId2: recipient2.id,
        lastMessageTime: new Date(),
        lastMessageContent: "明天有什么计划吗？",
      });
      await conversation2.save();
    });

    it("should get a paginated list of chat conversations", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/chatConversations")
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

    it("should sort chat conversations by updatedAt in descending order", (done) => {
      const sort = "updatedAt";
      const order = "desc";

      chai
        .request(app)
        .get("/admin/chatConversations")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });

    it("should filter chat conversations by userId1", (done) => {
      const userId1 = caller1.id; // Replace with actual userId1

      chai
        .request(app)
        .get("/admin/chatConversations")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ userId1 })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].user1.id).to.equal(userId1);
          done();
        });
    });

    it("should filter chat conversations by userId2", (done) => {
      const userId2 = recipient1.id; // Replace with actual userId2

      chai
        .request(app)
        .get("/admin/chatConversations")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ userId2 })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items[0].user2.id).to.equal(userId2);
          done();
        });
    });
  });

  describe("PUT /admin/chatConversations/:conversationId", () => {
    let conversationId;

    before((done) => {
      // 创建聊天会话
      const newConversation = {
        userId1: caller1.id,
        userId2: recipient1.id,
        lastMessageTime: null,
        lastMessageContent: null,
      };

      ChatConversation.create(newConversation, (err, conversation) => {
        conversationId = conversation._id; // 保存新增聊天会话的ID
        done();
      });
    });

    it("should update a chat conversation", (done) => {
      const updatedConversation = {
        userId1: caller2.id,
        userId2: recipient2.id,
        lastMessageTime: new Date("2023-08-14T12:30:00Z"),
        lastMessageContent: "Hello, how are you today?",
      };

      chai
        .request(app)
        .put(`/admin/chatConversations/${conversationId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedConversation)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          ChatConversation.findById(conversationId, (err, conversation) => {
            expect(conversation.userId1.toString()).to.equal(
              updatedConversation.userId1
            );
            expect(conversation.userId2.toString()).to.equal(
              updatedConversation.userId2
            );
            expect(conversation.lastMessageTime.toISOString()).to.equal(
              updatedConversation.lastMessageTime.toISOString()
            );
            expect(conversation.lastMessageContent).to.equal(
              updatedConversation.lastMessageContent
            );
            done();
          });
        });
    });
  });
});
