const ChatConversation = require("../../models/ChatConversation");

const createChatConversation = async (req, res, next) => {
  try {
    const { userId1, userId2, lastMessageTime, lastMessageContent } = req.body;

    const chatConversation = await ChatConversation.create({
      userId1,
      userId2,
      lastMessageTime,
      lastMessageContent,
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

    const formattedChatConversations = chatConversations.map((conversation) => ({
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
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }));

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

module.exports = {
  createChatConversation,
  deleteChatConversations,
  getChatConversationList,
};
