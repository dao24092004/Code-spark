// file: src/routes/student.quiz.routes.js

const express = require('express');
const router = express.Router();
const studentQuizController = require('../controllers/student.quiz.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Route để bắt đầu bài thi
router.post('/:quizId/start', authenticateToken, checkPermission('quiz:start'), studentQuizController.startQuiz);

// <<< BỔ SUNG DÒNG NÀY >>>
// Route để nộp bài thi
//router.post('/submissions/:submissionId/submit', studentQuizController.submitQuiz);

module.exports = router;