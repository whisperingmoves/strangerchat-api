const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, beforeEach, afterEach, describe } = require("mocha");
const ioClient = require("socket.io-client");
const app = require("../../app");
const config = require("../../config");
const User = require("../../models/User");
const VoiceCallRecord = require("../../models/VoiceCallRecord");
const ChatConversation = require("../../models/ChatConversation");
const ChatMessage = require("../../models/ChatMessage");
const { calculateDistance } = require("../../utils/distanceUtils");
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("Messages Socket", () => {
  let mobile;
  let user;
  let token;
  let socket;

  let otherMobile;
  let otherUser;
  let otherToken;
  let otherSocket;

  let opponentDistance;

  beforeEach(async () => {
    // 生成随机的经度和纬度
    const longitude = 121.5 + Math.random() * 0.01;
    const latitude = 31.2 + Math.random() * 0.01;

    mobile = generateMobile();

    otherMobile = generateMobile();

    // 注册用户并获取 token
    const registerRes = await chai.request(app).post("/users/register").send({
      mobile: mobile,
      gender: "male",
      birthday: "2000-01-01",
      avatar: "avatar.png",
      longitude: longitude.toString(),
      latitude: latitude.toString(),
    });

    token = registerRes.body.token;

    // 通过手机号查找用户
    user = await User.findOne({ mobile: mobile });

    // 设置用户名
    user.username = "张三";
    await user.save();

    // 注册另一个用户并保存结果
    const registerOtherRes = await chai
      .request(app)
      .post("/users/register")
      .send({
        mobile: otherMobile,
        gender: "female",
        birthday: "1995-01-01",
        avatar: "avatar2.png",
        longitude: (longitude + 0.0001).toString(),
        latitude: latitude.toString(),
      });

    otherToken = registerOtherRes.body.token;

    // 通过其他手机号查找其他用户
    otherUser = await User.findOne({ mobile: otherMobile });

    // 设置其他用户名
    otherUser.username = "李四";
    await otherUser.save();

    // 双方距离
    opponentDistance = calculateDistance(
      user.location.coordinates,
      otherUser.location.coordinates
    );
  });

  describe("Create Chat Conversation", () => {
    it("should receive created conversation notification on both users", (done) => {
      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 创建带有认证信息的其他用户 WebSocket 连接
      otherSocket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: otherToken,
        },
      });

      // 创建标志变量来跟踪断言状态
      let socketAssertion = false;
      let otherSocketAssertion = false;

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          // 只处理创建的聊天会话对象消息
          if (message.type !== 3) {
            return;
          }

          // 对方距我距离
          const opponentDistance = calculateDistance(
            user.location.coordinates,
            otherUser.location.coordinates
          );

          // 验证会话对象的结构和属性
          const conversation = message.data;
          chai.expect(conversation).to.have.property("conversationId");
          chai.expect(conversation).to.have.property("opponentUserId");
          chai.expect(conversation).to.have.property("opponentAvatar");
          chai.expect(conversation).to.have.property("opponentUsername");
          chai.expect(conversation).to.have.property("opponentOnlineStatus");
          chai.expect(conversation).to.have.property("opponentDistance");

          // 验证会话对象的属性值
          chai.expect(conversation.conversationId).to.be.a("string");
          chai.expect(conversation.opponentUserId).to.be.a("string");
          chai.expect(conversation.opponentAvatar).to.be.a("string");
          chai.expect(conversation.opponentUsername).to.be.a("string");
          chai.expect(conversation.opponentOnlineStatus).to.be.a("number");
          chai.expect(conversation.opponentDistance).to.be.a("number");

          // 验证会话对象的属性值与预期值是否匹配
          chai.expect(conversation.opponentUserId).to.equal(otherUser.id);
          chai.expect(conversation.opponentAvatar).to.equal(otherUser.avatar);
          chai
            .expect(conversation.opponentUsername)
            .to.equal(otherUser.username);
          chai.expect(conversation.opponentOnlineStatus).to.equal(1);
          chai
            .expect(conversation.opponentDistance)
            .to.be.equal(opponentDistance);

          // 设置断言标志为true
          socketAssertion = true;
        });
      });

      // 其他用户监听连接成功事件
      otherSocket.on("connect", () => {
        // 监听 WebSocket 推送消息
        otherSocket.on("notifications", (message) => {
          // 只处理创建的聊天会话对象消息
          if (message.type !== 3) {
            return;
          }

          // 验证会话对象的结构和属性
          const conversation = message.data;
          chai.expect(conversation).to.have.property("clientConversationId");
          chai.expect(conversation).to.have.property("conversationId");
          chai.expect(conversation).to.have.property("opponentUserId");
          chai.expect(conversation).to.have.property("opponentAvatar");
          chai.expect(conversation).to.have.property("opponentUsername");
          chai.expect(conversation).to.have.property("opponentOnlineStatus");
          chai.expect(conversation).to.have.property("opponentDistance");

          // 验证会话对象的属性值
          chai.expect(conversation.clientConversationId).to.be.a("string");
          chai.expect(conversation.conversationId).to.be.a("string");
          chai.expect(conversation.opponentUserId).to.be.a("string");
          chai.expect(conversation.opponentAvatar).to.be.a("string");
          chai.expect(conversation.opponentUsername).to.be.a("string");
          chai.expect(conversation.opponentOnlineStatus).to.be.a("number");
          chai.expect(conversation.opponentDistance).to.be.a("number");

          // 验证会话对象的属性值与预期值是否匹配
          chai.expect(conversation.clientConversationId).to.equal("1");
          chai.expect(conversation.opponentUserId).to.equal(user.id);
          chai.expect(conversation.opponentAvatar).to.equal(user.avatar);
          chai.expect(conversation.opponentUsername).to.equal(user.username);
          chai.expect(conversation.opponentOnlineStatus).to.equal(1);
          chai
            .expect(conversation.opponentDistance)
            .to.be.equal(opponentDistance);

          // 设置断言标志为true
          otherSocketAssertion = true;
        });
      });

      // 检查回调的断言状态
      const intervalId = setInterval(() => {
        if (socketAssertion && otherSocketAssertion) {
          clearInterval(intervalId);
          done();
        }
      }, 100);

      // 其他用户客户端推送创建聊天会话消息到服务端
      otherSocket.emit("messages", {
        type: 0,
        data: {
          clientConversationId: "1",
          opponentUserId: user.id,
        },
      });
    });
  });

  describe("Get Recent Chat Conversations", () => {
    it("should receive recent conversations notification on current user", (done) => {
      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          // 如果是聊天会话对象消息
          if (message.type === 3) {
            // 验证会话对象的结构和属性
            const conversation = message.data;
            chai.expect(conversation).to.have.property("conversationId");

            // 验证会话对象的属性值
            chai.expect(conversation.conversationId).to.be.a("string");

            // 获取会话id
            const conversationId = conversation.conversationId;

            // 客户端推送发送消息到服务端
            socket.emit("messages", {
              type: 4,
              data: {
                conversationId,
                opponentUserId: otherUser.id,
                content: "Hello",
              },
            });

            return;
          }

          // 如果是发送的消息对象消息
          if (message.type === 7) {
            // 验证消息对象的结构和属性
            const messageData = message.data;
            chai.expect(messageData).to.have.property("sentTime");

            // 验证消息对象的属性值
            chai.expect(messageData.sentTime).to.be.a("number");

            // 客户端推送获取最近的聊天会话列表消息到服务端
            socket.emit("messages", {
              type: 1,
              data: {
                timestamp: messageData.sentTime,
              },
            });

            return;
          }

          // 如果是最近的聊天会话列表消息
          if (message.type === 4) {
            // 验证消息的结构和属性
            const conversations = message.data;
            chai.expect(conversations).to.be.an("array").that.is.not.empty;

            for (const conversation of conversations) {
              // 验证会话对象的结构和属性
              chai.expect(conversation).to.have.property("conversationId");
              chai.expect(conversation).to.have.property("opponentUserId");
              chai.expect(conversation).to.have.property("opponentAvatar");
              chai.expect(conversation).to.have.property("opponentUsername");
              chai
                .expect(conversation)
                .to.have.property("opponentOnlineStatus");
              chai.expect(conversation).to.have.property("opponentDistance");
              chai.expect(conversation).to.have.property("lastMessageTime");
              chai.expect(conversation).to.have.property("lastMessageContent");
              chai.expect(conversation).to.have.property("unreadCount");

              // 验证会话对象的属性值
              chai.expect(conversation.conversationId).to.be.a("string");
              chai.expect(conversation.opponentUserId).to.be.a("string");
              chai.expect(conversation.opponentAvatar).to.be.a("string");
              chai.expect(conversation.opponentUsername).to.be.a("string");
              chai.expect(conversation.opponentOnlineStatus).to.be.a("number");
              chai.expect(conversation.opponentDistance).to.be.a("number");
              chai.expect(conversation.lastMessageTime).to.be.a("number");
              chai.expect(conversation.lastMessageContent).to.be.a("string");
              chai.expect(conversation.unreadCount).to.be.a("number");

              // 验证会话对象的属性值与预期值是否匹配
              chai.expect(conversation.opponentUserId).to.equal(otherUser.id);
              chai
                .expect(conversation.opponentAvatar)
                .to.equal(otherUser.avatar);
              chai
                .expect(conversation.opponentUsername)
                .to.equal(otherUser.username);
              chai.expect(conversation.opponentOnlineStatus).to.equal(0);
              chai
                .expect(conversation.opponentDistance)
                .to.be.equal(opponentDistance);
              chai.expect(conversation.unreadCount).to.be.equal(0);

              done();
            }
          }
        });
      });

      // 推送创建聊天会话消息到服务端
      socket.emit("messages", {
        type: 0,
        data: {
          opponentUserId: otherUser.id,
        },
      });
    });
  });

  describe("Get Chat Conversation Details", () => {
    it("should receive conversation details notification on opponent user", (done) => {
      // 会话id
      let conversationId;

      // 最后一条消息的发送时间
      let lastMessageTime;

      // 最后一条消息的内容
      let lastMessageContent = "Hello";

      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 创建带有其他用户认证信息的 WebSocket 连接
      otherSocket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: otherToken,
        },
      });

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          // 如果是聊天会话对象消息
          if (message.type === 3) {
            // 验证会话对象的结构和属性
            const conversation = message.data;
            chai.expect(conversation).to.have.property("conversationId");

            // 验证会话对象的属性值
            chai.expect(conversation.conversationId).to.be.a("string");

            // 获取会话id
            conversationId = conversation.conversationId;

            // 客户端推送发送消息到服务端
            socket.emit("messages", {
              type: 4,
              data: {
                conversationId,
                opponentUserId: otherUser.id,
                content: lastMessageContent,
              },
            });
          }
        });
      });

      // 其他用户监听连接成功事件
      otherSocket.on("connect", () => {
        // 监听 WebSocket 推送消息
        otherSocket.on("notifications", (message) => {
          if (message.type === 7) {
            // 验证消息对象的结构和属性
            const messageData = message.data;
            chai.expect(messageData).to.have.property("content");
            chai.expect(messageData).to.have.property("sentTime");

            // 验证消息对象的属性值
            chai.expect(messageData.content).to.be.a("string");
            chai.expect(messageData.sentTime).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.content).to.equal(lastMessageContent);

            // 设置最后一条消息的发送时间
            lastMessageTime = messageData.sentTime;

            // 客户端推送获取聊天会话详情消息到服务端
            otherSocket.emit("messages", {
              type: 2,
              data: {
                conversationId,
              },
            });

            return;
          }

          // 如果是聊天会话的详细信息消息
          if (message.type === 5) {
            // 验证消息的结构和属性
            const conversation = message.data;

            // 验证会话对象的结构和属性
            chai.expect(conversation).to.have.property("conversationId");
            chai.expect(conversation).to.have.property("opponentUserId");
            chai.expect(conversation).to.have.property("opponentAvatar");
            chai.expect(conversation).to.have.property("opponentUsername");
            chai.expect(conversation).to.have.property("opponentOnlineStatus");
            chai.expect(conversation).to.have.property("opponentDistance");
            chai.expect(conversation).to.have.property("lastMessageTime");
            chai.expect(conversation).to.have.property("lastMessageContent");
            chai.expect(conversation).to.have.property("unreadCount");

            // 验证会话对象的属性值
            chai.expect(conversation.conversationId).to.be.a("string");
            chai.expect(conversation.opponentUserId).to.be.a("string");
            chai.expect(conversation.opponentAvatar).to.be.a("string");
            chai.expect(conversation.opponentUsername).to.be.a("string");
            chai.expect(conversation.opponentOnlineStatus).to.be.a("number");
            chai.expect(conversation.opponentDistance).to.be.a("number");
            chai.expect(conversation.lastMessageTime).to.be.a("number");
            chai.expect(conversation.lastMessageContent).to.be.a("string");
            chai.expect(conversation.unreadCount).to.be.a("number");

            // 验证会话对象的属性值与预期值是否匹配
            chai.expect(conversation.conversationId).to.equal(conversationId);
            chai.expect(conversation.opponentUserId).to.equal(user.id);
            chai.expect(conversation.opponentAvatar).to.equal(user.avatar);
            chai.expect(conversation.opponentUsername).to.equal(user.username);
            chai.expect(conversation.opponentOnlineStatus).to.equal(1);
            chai
              .expect(conversation.opponentDistance)
              .to.be.equal(opponentDistance);
            chai
              .expect(conversation.lastMessageTime)
              .to.be.equal(lastMessageTime);
            chai
              .expect(conversation.lastMessageContent)
              .to.be.equal(lastMessageContent);
            chai.expect(conversation.unreadCount).to.be.equal(1);

            done();
          }
        });
      });

      // 推送创建聊天会话消息到服务端
      socket.emit("messages", {
        type: 0,
        data: {
          opponentUserId: otherUser.id,
        },
      });
    });
  });

  describe("Get Recent Chat Messages", () => {
    it("should receive messages notification on opponent user", (done) => {
      // 会话id
      let conversationId;

      // 消息id
      let messageId;

      // 最后一条消息的发送时间
      let lastMessageTime;

      // 最后一条消息的内容
      let lastMessageContent = "Hello";

      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 创建带有其他用户认证信息的 WebSocket 连接
      otherSocket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: otherToken,
        },
      });

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          // 如果是聊天会话对象消息
          if (message.type === 3) {
            // 验证会话对象的结构和属性
            const conversation = message.data;
            chai.expect(conversation).to.have.property("conversationId");

            // 验证会话对象的属性值
            chai.expect(conversation.conversationId).to.be.a("string");

            // 获取会话id
            conversationId = conversation.conversationId;

            // 客户端推送发送消息到服务端
            socket.emit("messages", {
              type: 4,
              data: {
                conversationId,
                opponentUserId: otherUser.id,
                content: lastMessageContent,
              },
            });
          }
        });
      });

      // 其他用户监听连接成功事件
      otherSocket.on("connect", () => {
        // 监听 WebSocket 推送消息
        otherSocket.on("notifications", (message) => {
          if (message.type === 7) {
            // 验证消息对象的结构和属性
            const messageData = message.data;
            chai.expect(messageData).to.have.property("messageId");
            chai.expect(messageData).to.have.property("content");
            chai.expect(messageData).to.have.property("sentTime");

            // 验证消息对象的属性值
            chai.expect(messageData.messageId).to.be.a("string");
            chai.expect(messageData.content).to.be.a("string");
            chai.expect(messageData.sentTime).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.content).to.equal(lastMessageContent);

            // 设置最后一条消息的发送时间
            lastMessageTime = messageData.sentTime;

            // 设置消息id
            messageId = messageData.messageId;

            // 客户端推送获取最近的聊天消息列表消息到服务端
            otherSocket.emit("messages", {
              type: 3,
              data: {
                conversationId,
                timestamp: lastMessageTime,
              },
            });

            return;
          }

          // 如果是最近的聊天消息列表消息
          if (message.type === 6) {
            // 验证消息的结构和属性
            const messages = message.data;
            chai.expect(messages).to.be.an("array").that.is.not.empty;

            for (const messagesData of messages) {
              // 验证消息对象的结构和属性
              chai.expect(messagesData).to.have.property("conversationId");
              chai.expect(messagesData).to.have.property("messageId");
              chai.expect(messagesData).to.have.property("senderId");
              chai.expect(messagesData).to.have.property("recipientId");
              chai.expect(messagesData).to.have.property("sentTime");
              chai.expect(messagesData).to.have.property("content");
              chai.expect(messagesData).to.have.property("readStatus");

              // 验证消息对象的属性值
              chai.expect(messagesData.conversationId).to.be.a("string");
              chai.expect(messagesData.messageId).to.be.a("string");
              chai.expect(messagesData.senderId).to.be.a("string");
              chai.expect(messagesData.recipientId).to.be.a("string");
              chai.expect(messagesData.sentTime).to.be.a("number");
              chai.expect(messagesData.content).to.be.a("string");
              chai.expect(messagesData.readStatus).to.be.a("number");

              // 验证消息对象的属性值与预期值是否匹配
              chai.expect(messagesData.conversationId).to.equal(conversationId);
              chai.expect(messagesData.messageId).to.equal(messageId);
              chai.expect(messagesData.senderId).to.equal(user.id);
              chai.expect(messagesData.recipientId).to.equal(otherUser.id);
              chai.expect(messagesData.sentTime).to.equal(lastMessageTime);
              chai.expect(messagesData.content).to.equal(lastMessageContent);
              chai.expect(messagesData.readStatus).to.equal(0);
            }

            done();
          }
        });
      });

      // 推送创建聊天会话消息到服务端
      socket.emit("messages", {
        type: 0,
        data: {
          opponentUserId: otherUser.id,
        },
      });
    });
  });

  describe("Send Message", () => {
    it("should receive messages notification on opponent user", (done) => {
      // 会话id
      let conversationId;

      // 最后一条消息的内容
      let lastMessageContent = "Hello";

      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 创建带有其他用户认证信息的 WebSocket 连接
      otherSocket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: otherToken,
        },
      });

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          // 如果是聊天会话对象消息
          if (message.type === 3) {
            // 验证会话对象的结构和属性
            const conversation = message.data;
            chai.expect(conversation).to.have.property("conversationId");

            // 验证会话对象的属性值
            chai.expect(conversation.conversationId).to.be.a("string");

            // 获取会话id
            conversationId = conversation.conversationId;

            // 客户端推送发送消息到服务端
            socket.emit("messages", {
              type: 4,
              data: {
                conversationId,
                opponentUserId: otherUser.id,
                content: lastMessageContent,
              },
            });
          }
        });
      });

      // 其他用户监听连接成功事件
      otherSocket.on("connect", () => {
        // 监听 WebSocket 推送消息
        otherSocket.on("notifications", (message) => {
          if (message.type === 7) {
            // 验证消息对象的结构和属性
            const messageData = message.data;
            chai.expect(messageData).to.have.property("conversationId");
            chai.expect(messageData).to.have.property("messageId");
            chai.expect(messageData).to.have.property("senderId");
            chai.expect(messageData).to.have.property("recipientId");
            chai.expect(messageData).to.have.property("content");
            chai.expect(messageData).to.have.property("sentTime");
            chai.expect(messageData).to.have.property("readStatus");

            // 验证消息对象的属性值
            chai.expect(messageData.conversationId).to.be.a("string");
            chai.expect(messageData.messageId).to.be.a("string");
            chai.expect(messageData.senderId).to.be.a("string");
            chai.expect(messageData.recipientId).to.be.a("string");
            chai.expect(messageData.content).to.be.a("string");
            chai.expect(messageData.sentTime).to.be.a("number");
            chai.expect(messageData.readStatus).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.conversationId).to.equal(conversationId);
            chai.expect(messageData.senderId).to.equal(user.id);
            chai.expect(messageData.recipientId).to.equal(otherUser.id);
            chai.expect(messageData.content).to.equal(lastMessageContent);
            chai.expect(messageData.readStatus).to.equal(0);

            done();
          }
        });
      });

      // 推送创建聊天会话消息到服务端
      socket.emit("messages", {
        type: 0,
        data: {
          opponentUserId: otherUser.id,
        },
      });
    });
  });

  describe("Mark Message As Read", () => {
    it("should receive marked-read message notification on both users", (done) => {
      // 会话id
      let conversationId;

      // 消息id
      let messageId;

      // 最后一条消息的内容
      let lastMessageContent = "Hello";

      // 创建标志变量来跟踪断言状态
      let socketAssertion = false;
      let otherSocketAssertion = false;

      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 创建带有其他用户认证信息的 WebSocket 连接
      otherSocket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: otherToken,
        },
      });

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          // 如果是聊天会话对象消息
          if (message.type === 3) {
            // 验证会话对象的结构和属性
            const conversation = message.data;
            chai.expect(conversation).to.have.property("conversationId");

            // 验证会话对象的属性值
            chai.expect(conversation.conversationId).to.be.a("string");

            // 获取会话id
            conversationId = conversation.conversationId;

            // 客户端推送发送消息到服务端
            socket.emit("messages", {
              type: 4,
              data: {
                conversationId,
                opponentUserId: otherUser.id,
                content: lastMessageContent,
              },
            });
          }

          // 如果是已标记为已读的消息对象
          if (message.type === 8) {
            // 验证消息的结构和属性
            const messageData = message.data;

            // 验证消息对象的结构和属性
            chai.expect(messageData).to.have.property("conversationId");
            chai.expect(messageData).to.have.property("messageId");
            chai.expect(messageData).to.have.property("readStatus");

            // 验证消息对象的属性值
            chai.expect(messageData.conversationId).to.be.a("string");
            chai.expect(messageData.messageId).to.be.a("string");
            chai.expect(messageData.readStatus).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.conversationId).to.equal(conversationId);
            chai.expect(messageData.messageId).to.equal(messageId);
            chai.expect(messageData.readStatus).to.equal(1);

            socketAssertion = true;
          }
        });
      });

      // 其他用户监听连接成功事件
      otherSocket.on("connect", () => {
        // 监听 WebSocket 推送消息
        otherSocket.on("notifications", (message) => {
          if (message.type === 7) {
            // 验证消息对象的结构和属性
            const messageData = message.data;
            chai.expect(messageData).to.have.property("conversationId");
            chai.expect(messageData).to.have.property("messageId");
            chai.expect(messageData).to.have.property("content");
            chai.expect(messageData).to.have.property("sentTime");

            // 验证消息对象的属性值
            chai.expect(messageData.conversationId).to.be.a("string");
            chai.expect(messageData.messageId).to.be.a("string");
            chai.expect(messageData.content).to.be.a("string");
            chai.expect(messageData.sentTime).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.conversationId).to.equal(conversationId);
            chai.expect(messageData.content).to.equal(lastMessageContent);

            // 设置消息id
            messageId = messageData.messageId;

            // 客户端推送标记消息已读消息到服务端
            otherSocket.emit("messages", {
              type: 5,
              data: {
                conversationId,
                messageId,
              },
            });

            return;
          }

          // 如果是已标记为已读的消息对象
          if (message.type === 8) {
            // 验证消息的结构和属性
            const messageData = message.data;

            // 验证消息对象的结构和属性
            chai.expect(messageData).to.have.property("conversationId");
            chai.expect(messageData).to.have.property("messageId");
            chai.expect(messageData).to.have.property("readStatus");

            // 验证消息对象的属性值
            chai.expect(messageData.conversationId).to.be.a("string");
            chai.expect(messageData.messageId).to.be.a("string");
            chai.expect(messageData.readStatus).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.conversationId).to.equal(conversationId);
            chai.expect(messageData.messageId).to.equal(messageId);
            chai.expect(messageData.readStatus).to.equal(1);

            otherSocketAssertion = true;
          }
        });
      });

      // 检查回调的断言状态
      const intervalId = setInterval(() => {
        if (socketAssertion && otherSocketAssertion) {
          clearInterval(intervalId);
          done();
        }
      }, 100);

      // 推送创建聊天会话消息到服务端
      socket.emit("messages", {
        type: 0,
        data: {
          opponentUserId: otherUser.id,
        },
      });
    });
  });

  describe("Initiate Voice Call", () => {
    it("should receive voice call notification on both users", (done) => {
      // 会话id
      let conversationId;

      // 通话开始时间
      let startTime = 1662028800;

      // 通话结束时间
      let endTime = 1662028900;

      // 创建标志变量来跟踪断言状态
      let socketAssertion = false;
      let otherSocketAssertion = false;

      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 创建带有其他用户认证信息的 WebSocket 连接
      otherSocket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: otherToken,
        },
      });

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          // 如果是聊天会话对象消息
          if (message.type === 3) {
            // 验证会话对象的结构和属性
            const conversation = message.data;
            chai.expect(conversation).to.have.property("conversationId");

            // 验证会话对象的属性值
            chai.expect(conversation.conversationId).to.be.a("string");

            // 获取会话id
            conversationId = conversation.conversationId;

            // 客户端推送发起语音通话到服务端
            socket.emit("messages", {
              type: 6,
              data: {
                conversationId,
                opponentUserId: otherUser.id,
                startTime: startTime,
                endTime: endTime,
              },
            });
          }

          // 如果是创建的语音通话记录对象
          if (message.type === 9) {
            // 验证消息的结构和属性
            const messageData = message.data;

            // 验证消息对象的结构和属性
            chai.expect(messageData).to.have.property("conversationId");
            chai.expect(messageData).to.have.property("messageId");
            chai.expect(messageData).to.have.property("senderId");
            chai.expect(messageData).to.have.property("recipientId");
            chai.expect(messageData).to.have.property("voiceCallRecordId");
            chai.expect(messageData).to.have.property("startTime");
            chai.expect(messageData).to.have.property("endTime");
            chai.expect(messageData).to.have.property("readStatus");

            // 验证消息对象的属性值
            chai.expect(messageData.conversationId).to.be.a("string");
            chai.expect(messageData.messageId).to.be.a("string");
            chai.expect(messageData.senderId).to.be.a("string");
            chai.expect(messageData.recipientId).to.be.a("string");
            chai.expect(messageData.voiceCallRecordId).to.be.a("string");
            chai.expect(messageData.startTime).to.be.a("number");
            chai.expect(messageData.endTime).to.be.a("number");
            chai.expect(messageData.readStatus).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.conversationId).to.equal(conversationId);
            chai.expect(messageData.senderId).to.equal(user.id);
            chai.expect(messageData.recipientId).to.equal(otherUser.id);
            chai.expect(messageData.startTime).to.equal(startTime);
            chai.expect(messageData.endTime).to.equal(endTime);
            chai.expect(messageData.readStatus).to.equal(0);

            socketAssertion = true;
          }
        });
      });

      // 其他用户监听连接成功事件
      otherSocket.on("connect", () => {
        // 监听 WebSocket 推送消息
        otherSocket.on("notifications", (message) => {
          // 如果是已创建的语音通话记录对象
          if (message.type === 9) {
            // 验证消息的结构和属性
            const messageData = message.data;

            // 验证消息对象的结构和属性
            chai.expect(messageData).to.have.property("conversationId");
            chai.expect(messageData).to.have.property("messageId");
            chai.expect(messageData).to.have.property("senderId");
            chai.expect(messageData).to.have.property("recipientId");
            chai.expect(messageData).to.have.property("voiceCallRecordId");
            chai.expect(messageData).to.have.property("startTime");
            chai.expect(messageData).to.have.property("endTime");
            chai.expect(messageData).to.have.property("readStatus");

            // 验证消息对象的属性值
            chai.expect(messageData.conversationId).to.be.a("string");
            chai.expect(messageData.messageId).to.be.a("string");
            chai.expect(messageData.senderId).to.be.a("string");
            chai.expect(messageData.recipientId).to.be.a("string");
            chai.expect(messageData.voiceCallRecordId).to.be.a("string");
            chai.expect(messageData.startTime).to.be.a("number");
            chai.expect(messageData.endTime).to.be.a("number");
            chai.expect(messageData.readStatus).to.be.a("number");

            // 验证消息对象的属性值与预期值是否匹配
            chai.expect(messageData.conversationId).to.equal(conversationId);
            chai.expect(messageData.senderId).to.equal(user.id);
            chai.expect(messageData.recipientId).to.equal(otherUser.id);
            chai.expect(messageData.startTime).to.equal(startTime);
            chai.expect(messageData.endTime).to.equal(endTime);
            chai.expect(messageData.readStatus).to.equal(0);

            otherSocketAssertion = true;
          }
        });
      });

      // 检查回调的断言状态
      const intervalId = setInterval(() => {
        if (socketAssertion && otherSocketAssertion) {
          clearInterval(intervalId);
          done();
        }
      }, 100);

      // 推送创建聊天会话消息到服务端
      socket.emit("messages", {
        type: 0,
        data: {
          opponentUserId: otherUser.id,
        },
      });
    });
  });

  describe("WebRTC Signaling", () => {
    it("should receive WebRTC signaling notification on opponent users", (done) => {
      // WebRTC会话描述（SDP）
      const sdp = "v=0...";

      // 候选者信息字符串
      const candidate = "candidate:1234567890...";

      // ICE候选者的SDP媒体行索引
      const sdpMLineIndex = 0;

      // ICE候选者的SDP媒体行标识符
      const sdpMid = "audio";

      // 创建带有认证信息的 WebSocket 连接
      socket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: token,
        },
      });

      // 创建带有其他用户认证信息的 WebSocket 连接
      otherSocket = ioClient(`http://localhost:${config.port}`, {
        auth: {
          token: otherToken,
        },
      });

      // 创建标志变量来跟踪断言状态
      let firstAssertion = false;
      let secondAssertion = false;

      // 监听连接成功事件
      socket.on("connect", () => {
        // 监听 WebSocket 推送消息
        socket.on("notifications", (message) => {
          if (
            message.type !== 10 &&
            message.type !== 11 &&
            message.type !== 12
          ) {
            return;
          }

          if (message.type === 10 || message.type === 11) {
            const signal = message.data;

            // 验证信令对象的结构和属性
            chai.expect(signal).to.have.property("opponentUserId");
            chai.expect(signal).to.have.property("sdp");

            // 验证信令对象的属性值
            chai.expect(signal.opponentUserId).to.be.a("string");
            chai.expect(signal.sdp).to.be.a("string");

            // 验证信令对象的属性值与预期值是否匹配
            chai.expect(signal.opponentUserId).to.equal(otherUser.id);
            chai.expect(signal.sdp).to.equal(sdp);

            firstAssertion = true;
          }

          if (message.type === 12) {
            const signal = message.data;

            // 验证信令对象的结构和属性
            chai.expect(signal).to.have.property("opponentUserId");
            chai.expect(signal).to.have.property("candidate");
            chai.expect(signal).to.have.property("sdpMLineIndex");
            chai.expect(signal).to.have.property("sdpMid");

            // 验证信令对象的属性值
            chai.expect(signal.opponentUserId).to.be.a("string");
            chai.expect(signal.candidate).to.be.a("string");
            chai.expect(signal.sdpMLineIndex).to.be.a("number");
            chai.expect(signal.sdpMid).to.be.a("string");

            // 验证信令对象的属性值与预期值是否匹配
            chai.expect(signal.opponentUserId).to.equal(otherUser.id);
            chai.expect(signal.candidate).to.equal(candidate);
            chai.expect(signal.sdpMLineIndex).to.equal(sdpMLineIndex);
            chai.expect(signal.sdpMid).to.equal(sdpMid);

            secondAssertion = true;
          }
        });
      });

      // 其他用户监听连接成功事件
      otherSocket.on("connect", () => {
        // WebRTC的Offer信令
        otherSocket.emit("messages", {
          type: 7,
          data: {
            opponentUserId: user.id,
            sdp,
          },
        });

        // WebRTC的Answer信令
        otherSocket.emit("messages", {
          type: 8,
          data: {
            opponentUserId: user.id,
            sdp,
          },
        });

        // WebRTC的ICE Candidate信令
        otherSocket.emit("messages", {
          type: 9,
          data: {
            opponentUserId: user.id,
            candidate,
            sdpMLineIndex,
            sdpMid,
          },
        });
      });

      // 检查回调的断言状态
      const intervalId = setInterval(() => {
        if (firstAssertion && secondAssertion) {
          clearInterval(intervalId);
          done();
        }
      }, 10);
    });
  });

  afterEach(async () => {
    // 关闭 WebSocket 连接
    if (socket.connected) {
      socket.disconnect();
    }
    if (otherSocket.connected) {
      otherSocket.disconnect();
    }

    // 删除测试用户
    await User.deleteOne({ mobile: mobile });
    await User.deleteOne({ mobile: otherMobile });

    // 删除关联的语音通话记录
    await VoiceCallRecord.deleteMany({
      $or: [
        { callerId: user._id },
        { recipientId: user._id },
        { callerId: otherUser._id },
        { recipientId: otherUser._id },
      ],
    });

    // 删除关联的聊天会话
    await ChatConversation.deleteMany({
      $or: [
        { userId1: user._id },
        { userId2: user._id },
        { userId1: otherUser._id },
        { userId2: otherUser._id },
      ],
    });

    // 删除关联的聊天消息
    await ChatMessage.deleteMany({
      $or: [
        { senderId: user._id },
        { recipientId: user._id },
        { senderId: otherUser._id },
        { recipientId: otherUser._id },
      ],
    });
  });
});
