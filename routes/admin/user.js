const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const userController = require("../../controllers/admin/user");

const router = express.Router();

// 用户路由
router.post("/users", adminAuth, userController.createUser);

module.exports = router;
