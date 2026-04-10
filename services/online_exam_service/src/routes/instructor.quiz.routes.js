const express = require('express');
const router = express.Router();
const instructorQuizController = require('../controllers/instructor.quiz.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');

router.post('/answers/:answerId/grade', authenticateToken, checkPermission('grading:manual'), instructorQuizController.gradeAnswer);

// ROUTE MỚI: Dành cho Java gọi sang (Nội bộ nên tạm thời không cần check Token)
// URL đầy đủ sẽ là: POST /api/api/instructor/quizzes/sync
router.post('/sync', instructorQuizController.syncQuiz); 

module.exports = router;