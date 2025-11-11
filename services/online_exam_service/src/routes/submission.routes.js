// file: src/routes/submission.routes.js
const express = require('express');
const router = express.Router();
const studentQuizController = require('../controllers/student.quiz.controller');
const { authenticateToken } = require('../middleware/auth.middleware');


// Protected routes - yêu cầu authentication
// URL này sẽ trở thành: POST /api/submissions/:submissionId/submit
router.post('/:submissionId/submit', authenticateToken, studentQuizController.submitQuiz);

// URL này sẽ trở thành: GET /api/submissions/:submissionId/result
router.get('/:submissionId/result', authenticateToken, studentQuizController.getSubmissionResult);


module.exports = router;
