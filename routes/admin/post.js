const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const postController = require("../../controllers/admin/post");

const router = express.Router();

// 帖子路由
router.post("/posts", adminAuth, postController.createPost);
router.delete("/posts", adminAuth, postController.deletePosts);

module.exports = router;
