const express = require("express");
const auth = require("../middlewares/auth");
const storyController = require("../controllers/story");

const router = express.Router();

// 故事路由
router.get("/stories", auth, storyController.getStoryList);

module.exports = router;
