// file: src/routes/index.js
const express = require('express');
const router = express.Router();

const studentQuizRoutes = require('./student.quiz.routes');
const instructorQuizRoutes = require('./instructor.quiz.routes'); // <<< IMPORT ROUTE MỚI
const submissionRoutes = require('./submission.routes'); // <-- IMPORT THÊM
const studentQuizController = require('../controllers/student.quiz.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Gắn các routes con vào router chính
router.use('/quizzes', studentQuizRoutes);
router.use('/instructor/quizzes', instructorQuizRoutes); // <<< SỬ DỤNG ROUTE MỚI
router.use('/submissions', submissionRoutes); // <-- SỬ DỤNG ROUTE MỚI

// Protected routes - yêu cầu authentication
// Route để lấy tất cả submissions của student hiện tại
router.get('/my-submissions', authenticateToken, studentQuizController.getMySubmissions);

module.exports = router;