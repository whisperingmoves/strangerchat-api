const express = require("express");
const adminAuth = require("../../middlewares/adminAuth");
const voiceCallRecordController = require("../../controllers/admin/voiceCallRecord");

const router = express.Router();

// 语音通话记录路由
router.post(
  "/voiceCallRecords",
  adminAuth,
  voiceCallRecordController.createVoiceCallRecord
);
router.delete(
  "/voiceCallRecords",
  adminAuth,
  voiceCallRecordController.deleteVoiceCallRecords
);
router.get(
  "/voiceCallRecords",
  adminAuth,
  voiceCallRecordController.getVoiceCallRecords
);
router.put(
  "/voiceCallRecords/:voiceCallRecordId",
  adminAuth,
  voiceCallRecordController.updateVoiceCallRecord
);

module.exports = router;
