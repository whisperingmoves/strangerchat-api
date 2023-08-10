const express = require("express");
const auth = require("../middlewares/auth");
const commentController = require("../controllers/comment");

const router = express.Router();

// 评论路由
router.delete("/comments/:commentId", auth, commentController.deleteComment);
router.post("/comments/:commentId/like", auth, commentController.likeComment);
router.get(
  "/comments/:commentId/replies",
  auth,
  commentController.getCommentReplies
);

module.exports = router;
