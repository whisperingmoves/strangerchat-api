// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const giftController = require("../../controllers/admin/gift");

const router = express.Router();

// 礼物路由
router.post("/gifts", adminAuth, giftController.createGift);
router.delete("/gifts", adminAuth, giftController.deleteGifts);
router.get("/gifts", adminAuth, giftController.getGiftList);
router.put("/gifts/:giftId", adminAuth, giftController.updateGift);

module.exports = router;
