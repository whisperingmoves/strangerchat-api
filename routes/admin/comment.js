const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const commentController = require("../../controllers/admin/comment");

const router = express.Router();

// 评论路由
router.post("/comments", adminAuth, commentController.createComment);
router.delete("/comments", adminAuth, commentController.deleteComments);
router.get("/comments", adminAuth, commentController.getCommentList);

module.exports = router;
