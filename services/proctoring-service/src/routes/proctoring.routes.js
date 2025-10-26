// file: proctoring-service/src/routes/proctoring.routes.js

const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoring.controller');

// Route cũ: Để lấy lịch sử vi phạm
router.get('/sessions/:sessionId/events', proctoringController.getEventsBySession);

// <<< BỔ SUNG >>>
// Route mới: Để nhận lệnh bắt đầu một phiên giám sát từ service khác
router.post('/sessions/start-monitoring', proctoringController.startProctoringSession);

module.exports = router;