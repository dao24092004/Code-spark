// file: src/routes/index.js
const express = require('express');
const router = express.Router();

const studentQuizRoutes = require('./student.quiz.routes');
const instructorQuizRoutes = require('./instructor.quiz.routes'); 
const submissionRoutes = require('./submission.routes'); 
const proctoringRoutes = require('./proctoring.routes');
const studentQuizController = require('../controllers/student.quiz.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Gắn các routes con vào router chính
router.use('/quizzes', studentQuizRoutes);
router.use('/instructor/quizzes', instructorQuizRoutes); 
router.use('/submissions', submissionRoutes); 
router.use('/proctoring', proctoringRoutes);

// Protected routes - yêu cầu authentication
// Route để lấy tất cả submissions của student hiện tại
router.get('/my-submissions', authenticateToken, studentQuizController.getMySubmissions);

module.exports = router;