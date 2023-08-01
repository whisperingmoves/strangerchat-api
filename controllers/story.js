const Post = require('../models/Post');

const getStoryList = async (req, res, next) => {
    let { page = "1", pageSize = "10" } = req.query;
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    try {
        const aggregateQuery = [
            {
                $match: { "images": { $exists: true, $ne: [] } }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "author"
                }
            },
            {
                $unwind: "$author"
            },
            {
                $project: {
                    "author._id": 1,
                    "author.avatar": 1,
                    "author.username": 1,
                    "createdAt": 1,
                    "images": 1
                }
            },
            {
                $skip: (page - 1) * pageSize
            },
            {
                $limit: pageSize
            }
        ];

        const posts = await Post.aggregate(aggregateQuery).exec();

        const formattedPosts = posts.map((post) => {
            const { _id, avatar, username } = post.author;
            const { createdAt, images } = post;

            return {
                userId: _id.toHexString(),
                avatar,
                username,
                createTime: Math.floor(createdAt.getTime() / 1000),
                firstImage: images[0],
                online: post.author.online,
            };
        });

        res.status(200).json(formattedPosts);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getStoryList,
}
