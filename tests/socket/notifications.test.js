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
const { it, beforeEach, afterEach, describe } = require("mocha");
const ioClient = require("socket.io-client");
const app = require("../../app");
const config = require("../../config");
const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const InteractionNotification = require("../../models/InteractionNotification");
const StatusNotification = require("../../models/StatusNotification");
const GiftNotification = require("../../models/GiftNotification");
const Gift = require("../../models/Gift");
const GiftHistory = require("../../models/GiftHistory");
const CoinProduct = require("../../models/CoinProduct");
const CoinTransaction = require("../../models/CoinTransaction");
const SystemNotification = require("../../models/SystemNotification");
const { calculateDistance } = require("../../utils/distanceUtils");
const { generateMobile } = require("../helper");

chai.use(chaiHttp);
chai.should();

describe("Notifications Socket", () => {
  let token;
  let socket;
  let mobile;
  let user;
  let nearbyUsers = [];
  let otherUser;
  let otherToken;
  let postId;

  beforeEach(async () => {
    // 生成随机的经度和纬度
    const longitude = 121.5 + Math.random() * 0.01;
    const latitude = 31.2 + Math.random() * 0.01;

    // 生成随机的手机号
    mobile = generateMobile();

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

    // 注册另一个用户并保存结果
    const otherUserMobile = generateMobile();
    const registerOtherRes = await chai
      .request(app)
      .post("/users/register")
      .send({
        mobile: otherUserMobile,
        gender: "female",
        birthday: "1995-01-01",
        avatar: "avatar2.png",
      });

    otherToken = registerOtherRes.body.token;

    otherUser = await User.findOne({ mobile: otherUserMobile });
    otherUser.coinBalance = 100; // 设置金币余额为100
    await otherUser.save(); // 保存更改

    // 发布帖子并保存帖子ID
    const postRes = await chai
      .request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        content: "这是一条帖子内容。",
        city: "北京",
        longitude: longitude.toString(),
        latitude: latitude.toString(),
        images: ["/uploads/xxx1.png", "/uploads/xxx2.png"],
      });

    postId = postRes.body.postId;

    // 注册5个距离当前用户最近的用户
    const otherUsers = [
      {
        mobile: generateMobile(),
        gender: "male",
        birthday: "1980-01-01",
        avatar: "avatar1.png",
        longitude: (longitude + 0.0001).toString(),
        latitude: latitude.toString(),
      },
      {
        mobile: generateMobile(),
        gender: "female",
        birthday: "1985-01-01",
        avatar: "avatar2.png",
        longitude: (longitude + 0.0002).toString(),
        latitude: (latitude + 0.0001).toString(),
      },
      {
        mobile: generateMobile(),
        gender: "male",
        birthday: "2000-01-01",
        avatar: "avatar3.png",
        longitude: (longitude + 0.0003).toString(),
        latitude: (latitude + 0.0002).toString(),
      },
      {
        mobile: generateMobile(),
        gender: "female",
        birthday: "1995-01-01",
        avatar: "avatar4.png",
        longitude: (longitude + 0.0004).toString(),
        latitude: (latitude + 0.0003).toString(),
      },
      {
        mobile: generateMobile(),
        gender: "male",
        birthday: "1990-01-01",
        avatar: "avatar5.png",
        longitude: (longitude + 0.0005).toString(),
        latitude: (latitude + 0.0004).toString(),
      },
    ];

    const promises = otherUsers.map((userInfo) => {
      return new Promise((resolve) => {
        chai
          .request(app)
          .post("/users/register")
          .send(userInfo)
          .then((registerRes) => {
            userInfo["userId"] = registerRes.body.userId;
            resolve(userInfo);
          });
      });
    });

    nearbyUsers = await Promise.all(promises);
  });

  it("should receive nearby users notifications from WebSocket", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 监听连接成功事件
    socket.on("connect", () => {
      // 等待 WebSocket 推送消息
      let messageReceived = false;

      socket.on("notifications", (message) => {
        // 如果找到符合要求的消息，则进行断言
        if (message.type === 0 && !messageReceived) {
          messageReceived = true;

          chai.expect(message).to.deep.equal({
            type: 0,
            data: {
              users: nearbyUsers.map((userInfo) => ({
                userId: userInfo.userId,
                avatarUrl: userInfo.avatar,
                distance: calculateDistance(user.location.coordinates, [
                  parseFloat(userInfo.longitude),
                  parseFloat(userInfo.latitude),
                ]),
              })),
            },
          });

          done();
        }
      });
    });
  });

  it("should receive online users notifications from WebSocket", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 监听连接成功事件
    socket.on("connect", () => {
      // 等待 WebSocket 推送消息
      let messageReceived = false;

      socket.on("notifications", (message) => {
        // 如果找到符合要求的消息，则进行断言
        if (message.type === 1 && !messageReceived) {
          messageReceived = true;

          chai.expect(message).to.deep.equal({
            type: 1,
            data: {
              online: 1,
            },
          });

          done();
        }
      });
    });
  });

  it("should receive unread notifications count from WebSocket", (done) => {
    // 创建5个不同类型的通知
    const notifications = [
      new InteractionNotification({
        toUser: user.id,
        user: otherUser.id,
        interactionType: 0,
        post: postId,
      }),
      new StatusNotification({
        toUser: user.id,
        user: otherUser.id,
        statusType: 1,
      }),
      new GiftNotification({
        toUser: user.id,
        user: otherUser.id,
        giftQuantity: 2,
        giftName: "礼物名称",
      }),
      new SystemNotification({
        toUser: user.id,
        notificationType: 0,
        notificationTitle: "系统通知",
        notificationContent: "系统通知内容",
      }),
      new InteractionNotification({
        toUser: user.id,
        user: otherUser.id,
        interactionType: 3,
        post: postId,
      }),
    ];
    const saveNotificationsPromises = notifications.map((notification) => {
      return new Promise((resolve, reject) => {
        notification.save((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    Promise.all(saveNotificationsPromises)
      .then(() => {
        // 创建带有认证信息的 WebSocket 连接
        socket = ioClient(`http://localhost:${config.port}`, {
          auth: {
            token: token,
          },
        });

        // 监听连接成功事件
        socket.on("connect", () => {
          // 等待 WebSocket 推送消息
          let messageReceived = false;

          socket.on("notifications", (message) => {
            // 如果找到符合要求的消息，则进行断言
            if (message.type === 2 && !messageReceived) {
              messageReceived = true;

              chai.expect(message).to.deep.equal({
                type: 2,
                data: {
                  count: 5,
                },
              });

              done();
            }
          });
        });
      })
      .catch((err) => {
        done(err);
      });
  });

  it("should receive unread notifications count via WebSocket after liking and unliking a post", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 记录未读通知数推送次数
    let unreadCount = 0;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        // 根据推送的消息次数进行断言
        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
        } else if (
          unreadCount === 2 &&
          message.type === 2 &&
          message.data.count === 0
        ) {
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      // 在连接成功后，调用给帖子点赞的接口
      chai
        .request(app)
        .post(`/posts/${postId}/like?action=1`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((likeErr) => {
          if (likeErr) {
            done(likeErr);
          }

          // 调用取消帖子点赞的接口
          chai
            .request(app)
            .post(`/posts/${postId}/like?action=0`)
            .set("Authorization", `Bearer ${otherToken}`)
            .end((unlikeErr) => {
              if (unlikeErr) {
                done(unlikeErr);
              }
            });
        });
    });
  });

  it("should receive unread notifications count via WebSocket after receiving a comment and comment deletion", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 记录未读通知数推送次数
    let unreadCount = 0;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        // 根据推送的消息次数进行断言
        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
        } else if (
          unreadCount === 2 &&
          message.type === 2 &&
          message.data.count === 0
        ) {
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      // 在连接成功后，调用给帖子评论的接口
      chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          content: "这是一条评论",
        })
        .end((commentErr, commentRes) => {
          if (commentErr) {
            done(commentErr);
          }

          // 获取评论ID
          const commentId = commentRes.body.commentId;

          // 在评论创建成功后，调用删除评论的接口
          chai
            .request(app)
            .delete(`/comments/${commentId}`)
            .set("Authorization", `Bearer ${otherToken}`)
            .end((deleteErr) => {
              if (deleteErr) {
                done(deleteErr);
              }
            });
        });
    });
  });

  it("should receive unread notifications count via WebSocket after a post is shared", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 标记是否已经接收到第一个未读通知数消息
    let firstUnreadMessageReceived = false;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (!firstUnreadMessageReceived) {
          firstUnreadMessageReceived = true;
          return;
        }

        // 对推送的消息进行断言
        chai.expect(message).to.deep.equal({
          type: 2,
          data: {
            count: 1,
          },
        });

        done();
      });

      // 在连接成功后，调用分享帖子的接口
      chai
        .request(app)
        .post(`/posts/${postId}/share`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({})
        .end((shareErr) => {
          if (shareErr) {
            done(shareErr);
          }
        });
    });
  });

  it("should receive unread notifications count via WebSocket after receiving a @ of a post", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 标记是否已经接收到第一个未读通知数消息
    let firstUnreadMessageReceived = false;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (!firstUnreadMessageReceived) {
          firstUnreadMessageReceived = true;
          return;
        }

        // 对推送的消息进行断言
        chai.expect(message).to.deep.equal({
          type: 2,
          data: {
            count: 1,
          },
        });

        done();
      });

      // 在连接成功后，调用发布帖子的接口
      chai
        .request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          content: "这是一条帖子内容。",
          atUsers: [user.id],
        })
        .end((postErr) => {
          if (postErr) {
            done(postErr);
          }
        });
    });
  });

  it("should receive unread notifications count via WebSocket after post is collected and uncollected", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 记录未读通知数推送次数
    let unreadCount = 0;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        // 根据推送的消息次数进行断言
        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
        } else if (
          unreadCount === 2 &&
          message.type === 2 &&
          message.data.count === 0
        ) {
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      // 在连接成功后，调用收藏帖子的接口
      chai
        .request(app)
        .post(`/posts/${postId}/collect`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          operation: 1,
        })
        .end((collectErr) => {
          if (collectErr) {
            done(collectErr);
          }

          // 在收藏成功后，调用取消收藏帖子的接口
          chai
            .request(app)
            .post(`/posts/${postId}/collect`)
            .set("Authorization", `Bearer ${otherToken}`)
            .send({
              operation: 0,
            })
            .end((uncollectErr) => {
              if (uncollectErr) {
                done(uncollectErr);
              }
            });
        });
    });
  });

  it("should receive unread notifications count via WebSocket after liking and unliking a comment", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 记录未读通知数推送次数
    let unreadCount = 0;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        // 根据推送的消息次数进行断言
        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
        } else if (
          unreadCount === 2 &&
          message.type === 2 &&
          message.data.count === 0
        ) {
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      // 在连接成功后，调用评论帖子/回复评论的接口
      chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "这是一条评论",
        })
        .end((commentErr, commentRes) => {
          if (commentErr) {
            done(commentErr);
          }

          const commentId = commentRes.body.commentId;

          // 使用获取到的评论ID调用点赞评论的接口
          chai
            .request(app)
            .post(`/comments/${commentId}/like`)
            .set("Authorization", `Bearer ${otherToken}`)
            .send({
              operation: 1,
            })
            .end((likeErr) => {
              if (likeErr) {
                done(likeErr);
              }

              // 在点赞成功后，调用取消点赞评论的接口
              chai
                .request(app)
                .post(`/comments/${commentId}/like`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({
                  operation: 0,
                })
                .end((unlikeErr) => {
                  if (unlikeErr) {
                    done(unlikeErr);
                  }
                });
            });
        });
    });
  });

  it("should receive unread notifications count via WebSocket after receiving a reply to a comment", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 标记是否已经接收到第一个未读通知数消息
    let firstUnreadMessageReceived = false;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (!firstUnreadMessageReceived) {
          firstUnreadMessageReceived = true;
          return;
        }

        // 对推送的消息进行断言
        chai.expect(message).to.deep.equal({
          type: 2,
          data: {
            count: 1,
          },
        });

        done();
      });

      // 在连接成功后，调用评论帖子的接口
      chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "这是一条评论",
        })
        .end((commentErr, commentRes) => {
          if (commentErr) {
            done(commentErr);
          }

          const commentId = commentRes.body.commentId;

          // 使用获取到的评论ID调用回复评论的接口
          chai
            .request(app)
            .post(`/posts/${postId}/comment`)
            .set("Authorization", `Bearer ${otherToken}`)
            .send({
              content: "这是一条回复评论",
              parentId: commentId, // 将评论的 ID 作为父级评论 ID
            })
            .end((replyErr) => {
              if (replyErr) {
                done(replyErr);
              }
            });
        });
    });
  });

  it("should receive unread notifications count via WebSocket after receiving a reply to a comment and deleting the reply", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 记录未读通知数推送次数
    let unreadCount = 0;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        // 根据推送的消息次数进行断言
        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
        } else if (
          unreadCount === 2 &&
          message.type === 2 &&
          message.data.count === 0
        ) {
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      // 在连接成功后，调用评论帖子的接口
      chai
        .request(app)
        .post(`/posts/${postId}/comment`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "这是一条评论",
        })
        .end((commentErr, commentRes) => {
          if (commentErr) {
            done(commentErr);
          }

          const commentId = commentRes.body.commentId;

          // 使用获取到的评论ID调用回复评论的接口
          chai
            .request(app)
            .post(`/posts/${postId}/comment`)
            .set("Authorization", `Bearer ${otherToken}`)
            .send({
              content: "这是一条回复评论",
              parentId: commentId, // 将评论的 ID 作为父级评论 ID
            })
            .end((replyErr, replyRes) => {
              if (replyErr) {
                done(replyErr);
              }

              const replyId = replyRes.body.commentId;

              // 使用获取到的回复评论的 ID 调用删除回复评论的接口
              chai
                .request(app)
                .delete(`/comments/${replyId}`)
                .set("Authorization", `Bearer ${otherToken}`)
                .end((deleteErr) => {
                  if (deleteErr) {
                    done(deleteErr);
                  }
                });
            });
        });
    });
  });

  it("should receive unread notifications count via WebSocket after following and unfollowing a user", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 记录未读通知数推送次数
    let unreadCount = 0;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        // 根据推送的消息次数进行断言
        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
        } else if (
          unreadCount === 2 &&
          message.type === 2 &&
          message.data.count === 0
        ) {
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      // 在连接成功后，调用关注用户的接口
      chai
        .request(app)
        .post(`/users/${user.id}/follow?action=1`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((followErr) => {
          if (followErr) {
            done(followErr);
          }

          // 调用取消关注用户的接口
          chai
            .request(app)
            .post(`/users/${user.id}/follow?action=0`)
            .set("Authorization", `Bearer ${otherToken}`)
            .end((unfollowErr) => {
              if (unfollowErr) {
                done(unfollowErr);
              }
            });
        });
    });
  });

  it("should receive unread notifications count via WebSocket after another user visits the user profile", (done) => {
    // 创建带有认证信息的 WebSocket 连接
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    // 记录未读通知数推送次数
    let unreadCount = 0;

    // 监听连接成功事件
    socket.on("connect", () => {
      // 监听 WebSocket 推送消息
      socket.on("notifications", (message) => {
        // 只处理未读通知数消息
        if (message.type !== 2) {
          return;
        }

        // 忽略第一个消息
        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        // 根据推送的消息次数进行断言
        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      // 在连接成功后，访问用户主页
      chai
        .request(app)
        .get(`/users/${user.id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((visitErr) => {
          if (visitErr) {
            done(visitErr);
          }
        });
    });
  });

  it("should receive unread notifications count via WebSocket after receiving a gift from another user", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    let unreadCount = 0;

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 2) {
          return;
        }

        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      Gift.create(
        {
          image: "example.jpg",
          name: "Example Gift",
          value: 10,
        },
        (error, createdGift) => {
          if (error) {
            done(error);
          } else {
            const giftId = createdGift.id;

            const sendGiftData = {
              receiverId: user.id,
              giftId: giftId,
              quantity: 1,
            };

            chai
              .request(app)
              .post("/gifts/send")
              .set("Authorization", `Bearer ${otherToken}`)
              .send(sendGiftData)
              .end((giftErr) => {
                if (giftErr) {
                  done(giftErr);
                }
              });
          }
        }
      );
    });
  });

  it("should receive unread notifications count via WebSocket after purchasing a coin product", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    let unreadCount = 0;

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 2) {
          return;
        }

        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      const coinProduct = new CoinProduct({
        coins: 100, // 金币数量
        originalPrice: 10, // 原始价格
        price: 5, // 购买价格
        currency: "USD", // 货币单位
      });

      coinProduct.save((error, savedProduct) => {
        if (error) {
          done(error);
        } else {
          const coinProductId = savedProduct.id;

          const purchaseData = {
            receipt: "eyJhbGciOiAiUlMyNTYiLCAidHlwIjogIkpXVCJ9...", // 第三方支付回调凭据
          };

          chai
            .request(app)
            .post(`/products/coins/${coinProductId}/buy`)
            .set("Authorization", `Bearer ${token}`)
            .send(purchaseData)
            .end((error) => {
              if (error) {
                done(error);
              }
            });
        }
      });
    });
  });

  it("should receive unread notifications count via WebSocket after perform checkin", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    let unreadCount = 0;

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 2) {
          return;
        }

        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      chai
        .request(app)
        .post("/users/checkin/check")
        .set("Authorization", `Bearer ${token}`)
        .end((error) => {
          if (error) {
            done(error);
          }
        });
    });
  });

  it("should receive unread notifications count via WebSocket after sender a gift", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: otherToken,
      },
    });

    let unreadCount = 0;

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 2) {
          return;
        }

        if (unreadCount === 0) {
          unreadCount++;
          return;
        }

        if (
          unreadCount === 1 &&
          message.type === 2 &&
          message.data.count === 1
        ) {
          unreadCount++;
          done();
        } else {
          done(
            new Error("Unexpected unread notifications count or message count")
          );
        }
      });

      Gift.create(
        {
          image: "example.jpg",
          name: "Example Gift",
          value: 10,
        },
        (error, createdGift) => {
          if (error) {
            done(error);
          } else {
            const giftId = createdGift.id;

            const sendGiftData = {
              receiverId: user.id,
              giftId: giftId,
              quantity: 1,
            };

            chai
              .request(app)
              .post("/gifts/send")
              .set("Authorization", `Bearer ${otherToken}`)
              .send(sendGiftData)
              .end((giftErr) => {
                if (giftErr) {
                  done(giftErr);
                }
              });
          }
        }
      );
    });
  });

  it("should receive coin balance via WebSocket after perform checkin", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: token,
      },
    });

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 13 || message.data.coinBalance === 0) {
          return;
        }

        if (message.data.coinBalance === 10) {
          done();
        } else {
          done(new Error("Unexpected coin balance"));
        }
      });

      chai
        .request(app)
        .post("/users/checkin/check")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("object");
          res.body.should.have
            .property("checkedDays")
            .that.is.a("number")
            .within(0, 7);
        });
    });
  });

  it("should receive coin balance via WebSocket after send a gift", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token: otherToken,
      },
    });

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 13 || message.data.coinBalance === 100) {
          return;
        }

        if (message.data.coinBalance === 90) {
          done();
        } else {
          done(new Error("Unexpected coin balance"));
        }
      });

      Gift.create(
        {
          image: "example.jpg",
          name: "Example Gift",
          value: 10,
        },
        (error, createdGift) => {
          if (error) {
            done(error);
          } else {
            const giftId = createdGift.id;

            const sendGiftData = {
              receiverId: user.id,
              giftId: giftId,
              quantity: 1,
            };

            chai
              .request(app)
              .post("/gifts/send")
              .set("Authorization", `Bearer ${otherToken}`)
              .send(sendGiftData)
              .end((giftErr) => {
                if (giftErr) {
                  done(giftErr);
                }
              });
          }
        }
      );
    });
  });

  it("should receive coin balance via WebSocket after buy coin product", (done) => {
    // 创建一个金币商品
    CoinProduct.create(
      {
        coins: 100,
        originalPrice: 1000,
        price: 900,
        currency: "CNY",
      },
      (error, result) => {
        if (error) {
          done(error);
        }

        const productId = result.id;

        // 生成一个随机字符串作为凭据
        const receipt = Math.random().toString(36).substr(2, 10);

        socket = ioClient(`http://localhost:${config.port}`, {
          auth: {
            token: token,
          },
        });

        socket.on("connect", () => {
          socket.on("notifications", (message) => {
            if (message.type !== 13 || message.data.coinBalance === 0) {
              return;
            }

            if (message.data.coinBalance === 100) {
              done();
            } else {
              done(new Error("Unexpected coin balance"));
            }
          });

          // 购买金币商品
          chai
            .request(app)
            .post(`/products/coins/${productId}/buy`)
            .set("Authorization", `Bearer ${token}`)
            .send({ receipt })
            .end((coinProductErr) => {
              if (coinProductErr) {
                done(coinProductErr);
              }
            });
        });
      }
    );
  });

  it("should receive received gifts via WebSocket after send a gift", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token,
      },
    });

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 14 || message.data.giftsReceived === 0) {
          return;
        }

        if (message.data.giftsReceived === 1) {
          done();
        } else {
          done(new Error("Unexpected received gifts"));
        }
      });

      Gift.create(
        {
          image: "example.jpg",
          name: "Example Gift",
          value: 10,
        },
        (error, createdGift) => {
          if (error) {
            done(error);
          } else {
            const giftId = createdGift.id;

            const sendGiftData = {
              receiverId: user.id,
              giftId: giftId,
              quantity: 1,
            };

            chai
              .request(app)
              .post("/gifts/send")
              .set("Authorization", `Bearer ${otherToken}`)
              .send(sendGiftData)
              .end((giftErr) => {
                if (giftErr) {
                  done(giftErr);
                }
              });
          }
        }
      );
    });
  });

  it("should receive followers count via WebSocket after follow user", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token,
      },
    });

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 15 || message.data.followersCount === 0) {
          return;
        }

        if (message.data.followersCount === 1) {
          done();
        } else {
          done(new Error("Unexpected received gifts"));
        }
      });

      chai
        .request(app)
        .post(`/users/${user.id}/follow?action=1`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({})
        .end((followErr) => {
          if (followErr) {
            done(followErr);
          }
        });
    });
  });

  it("should receive visitors count via WebSocket after visit user", (done) => {
    socket = ioClient(`http://localhost:${config.port}`, {
      auth: {
        token,
      },
    });

    socket.on("connect", () => {
      socket.on("notifications", (message) => {
        if (message.type !== 16 || message.data.visitorsCount === 0) {
          return;
        }

        if (message.data.visitorsCount === 1) {
          done();
        } else {
          done(new Error("Unexpected received gifts"));
        }
      });

      chai
        .request(app)
        .get(`/users/${user.id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .end((visitErr) => {
          if (visitErr) {
            done(visitErr);
          }
        });
    });
  });

  afterEach(async () => {
    // 关闭 WebSocket 连接
    if (socket.connected) {
      socket.disconnect();
    }

    // 删除测试用户和附近的用户
    await User.deleteOne({ mobile: mobile });

    // 删除测试帖子
    await Post.deleteOne({ author: user.id });

    // 删除测试评论
    await Comment.deleteOne({ author: user.id });

    // 删除相关的礼物历史记录
    await GiftHistory.deleteMany({ receiver: user.id });

    // 删除相关的金币交易记录
    await CoinTransaction.deleteMany({ userId: user.id });

    // 删除关联的交互类通知
    await InteractionNotification.deleteMany({
      $or: [
        { toUser: user._id },
        { user: user._id },
        { toUser: otherUser._id },
        { user: otherUser._id },
      ],
    });

    // 删除关联的状态类通知
    await StatusNotification.deleteMany({
      $or: [
        { toUser: user._id },
        { user: user._id },
        { toUser: otherUser._id },
        { user: otherUser._id },
      ],
    });

    // 删除关联的礼物类通知
    await GiftNotification.deleteMany({
      $or: [
        { toUser: user._id },
        { user: user._id },
        { toUser: otherUser._id },
        { user: otherUser._id },
      ],
    });

    // 删除关联的系统类通知
    await SystemNotification.deleteMany({
      $or: [{ toUser: user._id }, { toUser: otherUser._id }],
    });

    const promises = nearbyUsers.map((userInfo) => {
      return new Promise((resolve, reject) => {
        User.deleteOne({ _id: userInfo.userId })
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      });
    });

    await Promise.all(promises);
  });
});
