// file: src/routes/submission.routes.js
const express = require('express');
const router = express.Router();
const studentQuizController = require('../controllers/student.quiz.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// URL này sẽ trở thành: POST /api/submissions/:submissionId/submit
router.post('/:submissionId/submit', authenticateToken, checkPermission('quiz:submit'), studentQuizController.submitQuiz);

module.exports = router;