const express = require('express');
const router = express.Router();

const studentQuizRoutes = require('./student.quiz.routes');
const instructorQuizRoutes = require('./instructor.quiz.routes'); 
const submissionRoutes = require('./submission.routes'); 
const proctoringRoutes = require('./proctoring.routes');
const studentQuizController = require('../controllers/student.quiz.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * CẤU TRÚC ROUTE SAU KHI SỬA:
 * Vì Gateway gửi xuống path có dạng /api/api/...
 * nên chúng ta sẽ tạo một sub-router để gom nhóm các path này.
 */
const apiRouter = express.Router();

// Gắn các routes con vào apiRouter
// Kết quả sẽ khớp với: /api/api/quizzes, /api/api/instructor/quizzes, v.v.
apiRouter.use('/quizzes', studentQuizRoutes);
apiRouter.use('/instructor/quizzes', instructorQuizRoutes); 
apiRouter.use('/submissions', submissionRoutes); 
apiRouter.use('/proctoring', proctoringRoutes);

// Route lấy submissions của chính mình
apiRouter.get('/my-submissions', authenticateToken, studentQuizController.getMySubmissions);

// Gắn apiRouter vào router chính với prefix /api/api
router.use('/api/api', apiRouter);

/**
 * (Tùy chọn) Thêm một bản dự phòng cho trường hợp Gateway chỉ gửi 1 chữ /api
 * giúp code linh hoạt hơn.
 */
router.use('/api', apiRouter);

module.exports = router;