const InteractionNotification = require('../models/InteractionNotification');

exports.getInteractionNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        const userId = req.user.userId;

        const notifications = await InteractionNotification.find({ toUser: userId })
            .populate('user', 'id username avatar')
            .populate('post', 'id images')
            .populate('comment', 'id')
            .sort({ interactionTime: -1 })
            .skip(skip)
            .limit(pageSize);

        const formattedNotifications = notifications.map(notification => {
            const { id, interactionType, interactionTime, readStatus, post, user, comment } = notification;
            const { images } = post;
            const postImage = images[0];
            const { avatar } = user;
            const commentId = comment ? comment.id : undefined;
            return {
                notificationId: id,
                userAvatar: avatar,
                userId: user.id,
                userName: user.username,
                interactionType,
                interactionTime: Math.floor(interactionTime.getTime() / 1000),
                postId: post.id,
                postImage,
                readStatus: readStatus ? 1 : 0,
                commentId,
            };
        });

        res.status(200).json(formattedNotifications);
    } catch (error) {
        next(error);
    }
};