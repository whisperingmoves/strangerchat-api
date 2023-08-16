const InteractionNotification = require("../../models/InteractionNotification");

const createInteractionNotification = async (req, res, next) => {
  try {
    const {
      toUser,
      user,
      interactionType,
      post,
      comment,
      interactionTime,
      readStatus,
    } = req.body;

    const interactionNotification = await InteractionNotification.create({
      toUser,
      user,
      interactionType,
      post,
      comment,
      interactionTime,
      readStatus,
    });

    res.status(201).json({ id: interactionNotification.id });
  } catch (error) {
    next(error);
  }
};

const deleteInteractionNotifications = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await InteractionNotification.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInteractionNotification,
  deleteInteractionNotifications,
};
