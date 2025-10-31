// file: proctoring-service/src/routes/proctoring.routes.js

// file: proctoring-service/src/routes/proctoring.routes.js

const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoring.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Route cũ: Để lấy lịch sử vi phạm
router.get('/sessions/:sessionId/events', authenticateToken, checkPermission('proctoring:events:read'), proctoringController.getEventsBySession);

// <<< BỔ SUNG >>>
// Route mới: Để nhận lệnh bắt đầu một phiên giám sát từ service khác
//router.post('/sessions/start-monitoring', authenticateToken, checkPermission('proctoring:session:start'), proctoringController.startProctoringSession);
router.post('/sessions/start-monitoring', authenticateToken, proctoringController.startProctoringSession);

module.exports = router;