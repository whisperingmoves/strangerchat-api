const express = require("express");
const voiceCallRecordController = require("../../controllers/admin/voiceCallRecord");

const router = express.Router();

// 语音通话记录路由
router.post(
  "/voiceCallRecords",
  voiceCallRecordController.createVoiceCallRecord
);
router.delete(
  "/voiceCallRecords",
  voiceCallRecordController.deleteVoiceCallRecords
);
router.get("/voiceCallRecords", voiceCallRecordController.getVoiceCallRecords);
router.put(
  "/voiceCallRecords/:voiceCallRecordId",
  voiceCallRecordController.updateVoiceCallRecord
);

module.exports = router;
