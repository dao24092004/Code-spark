const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoring.controller');

// Định nghĩa một route:
// - Phương thức: GET
// - URL: /sessions/:sessionId/events
//   (:sessionId là một tham số động, có thể thay đổi)
// - Controller xử lý: proctoringController.getEventsBySession
router.get('/sessions/:sessionId/events', proctoringController.getEventsBySession);

module.exports = router;
