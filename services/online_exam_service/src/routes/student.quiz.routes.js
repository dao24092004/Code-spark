// file: src/routes/student.quiz.routes.js

const express = require('express');
const router = express.Router();
const studentQuizController = require('../controllers/student.quiz.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');


// Public routes (không cần authentication)
// Route để lấy tất cả quiz
router.get('/', studentQuizController.getAllQuizzes);

// Route để lấy chi tiết quiz (không tạo submission)
router.get('/:quizId', studentQuizController.getQuizDetails);

// Protected routes (yêu cầu authentication)
// Route để bắt đầu bài thi
router.post('/:quizId/start', authenticateToken, studentQuizController.startQuiz);


module.exports = router;