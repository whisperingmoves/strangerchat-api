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

const ChatMessage = require("../../models/ChatMessage");

const createChatMessage = async (req, res, next) => {
  try {
    const {
      conversationId,
      senderId,
      recipientId,
      sentTime,
      content,
      readStatus,
    } = req.body;

    const chatMessage = await ChatMessage.create({
      conversationId,
      senderId,
      recipientId,
      sentTime,
      content,
      readStatus,
    });

    res.status(201).json({ id: chatMessage.id });
  } catch (error) {
    next(error);
  }
};

const deleteChatMessages = async (req, res, next) => {
  try {
    const { ids } = req.query;

    // 删除聊天消息
    await ChatMessage.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getChatMessageList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      conversationId,
      senderId,
      recipientId,
      sort = "sentTime",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const filter = {};
    if (conversationId) filter["conversationId"] = conversationId;
    if (senderId) filter["senderId"] = senderId;
    if (recipientId) filter["recipientId"] = recipientId;

    const [total, chatMessages] = await Promise.all([
      ChatMessage.countDocuments(filter),
      ChatMessage.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate("senderId", "username")
        .populate("recipientId", "username")
        .select("-__v")
        .lean(),
    ]);

    const formattedChatMessages = chatMessages.map((message) => ({
      id: message._id,
      conversationId: message.conversationId,
      sender: {
        id: message.senderId._id,
        username: message.senderId.username,
      },
      recipient: {
        id: message.recipientId._id,
        username: message.recipientId.username,
      },
      sentTime: message.sentTime,
      content: message.content,
      readStatus: message.readStatus,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedChatMessages,
    });
  } catch (error) {
    next(error);
  }
};

const updateChatMessage = async (req, res, next) => {
  try {
    const {
      content,
      readStatus,
      conversationId,
      senderId,
      recipientId,
      sentTime,
    } = req.body;
    const { chatMessageId } = req.params;

    const chatMessage = await ChatMessage.findByIdAndUpdate(
      chatMessageId,
      {
        content,
        readStatus,
        conversationId,
        senderId,
        recipientId,
        sentTime,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!chatMessage) {
      return res.status(404).json({ message: "聊天消息不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatMessage,
  deleteChatMessages,
  getChatMessageList,
  updateChatMessage,
};
