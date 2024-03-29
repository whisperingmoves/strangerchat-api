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

const ChatConversation = require("../../models/ChatConversation");
const ChatMessage = require("../../models/ChatMessage");

const createChatConversation = async (req, res, next) => {
  try {
    const {
      userId1,
      userId2,
      lastMessageTime,
      lastMessageContent,
      lastMessageType,
    } = req.body;

    const chatConversation = await ChatConversation.create({
      userId1,
      userId2,
      lastMessageTime,
      lastMessageContent,
      lastMessageType,
    });

    res.status(201).json({ id: chatConversation.id });
  } catch (error) {
    next(error);
  }
};

const deleteChatConversations = async (req, res, next) => {
  try {
    const { ids } = req.query;

    // 删除聊天会话
    await ChatConversation.deleteMany({ _id: { $in: ids } });

    // 删除关联聊天消息
    await ChatMessage.deleteMany({ conversationId: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getChatConversationList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      userId1,
      userId2,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (userId1) filter["userId1"] = userId1;
    if (userId2) filter["userId2"] = userId2;

    const [total, chatConversations] = await Promise.all([
      ChatConversation.countDocuments(filter),
      ChatConversation.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("userId1", "username")
        .populate("userId2", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedChatConversations = chatConversations.map(
      (conversation) => ({
        id: conversation._id,
        user1: {
          id: conversation.userId1._id,
          username: conversation.userId1.username,
        },
        user2: {
          id: conversation.userId2._id,
          username: conversation.userId2.username,
        },
        lastMessageTime: conversation.lastMessageTime,
        lastMessageContent: conversation.lastMessageContent,
        lastMessageType: conversation.lastMessageType,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      })
    );

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedChatConversations,
    });
  } catch (error) {
    next(error);
  }
};

const updateChatConversation = async (req, res, next) => {
  try {
    const {
      userId1,
      userId2,
      lastMessageTime,
      lastMessageContent,
      lastMessageType,
    } = req.body;
    const { conversationId } = req.params;

    const conversation = await ChatConversation.findByIdAndUpdate(
      conversationId,
      {
        userId1,
        userId2,
        lastMessageTime,
        lastMessageContent,
        lastMessageType,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "聊天会话不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatConversation,
  deleteChatConversations,
  getChatConversationList,
  updateChatConversation,
};
