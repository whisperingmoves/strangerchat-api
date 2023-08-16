const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const postController = require("../../controllers/admin/post");

const router = express.Router();

// 帖子路由
router.post("/posts", adminAuth, postController.createPost);
router.delete("/posts", adminAuth, postController.deletePosts);
router.get("/posts", adminAuth, postController.getPostList);
router.put("/posts/:postId", adminAuth, postController.updatePost);

module.exports = router;
