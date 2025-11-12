// src/routes/recruitment.routes.js
const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitment.controller');
const { authenticateToken } = require('../middleware/auth.js');
const upload = require('../middleware/upload.middleware.js'); // <-- IMPORT UPLOAD MIDDLEWARE
// === API TUYỂN DỤNG (NHÓM 3) ===

// API 3 (Nhóm 3): POST /api/v1/recruitment/tests/:testId/questions
router.post(
  '/tests/:testId/questions',
  authenticateToken,
  recruitmentController.addQuestion
);
// API 4 (Nhóm 3): POST /api/v1/recruitment/tests/:testId/questions/upload
// (Thêm nhiều câu hỏi bằng file)
router.post(
  '/tests/:testId/questions/upload',
  authenticateToken,
  upload.single('questionsFile'), // <-- Middleware xử lý file
  recruitmentController.addQuestionsFromFile
);
// API 5 (Nhóm 3): POST /api/v1/recruitment/tests/:testId/submit
// (Ứng viên nộp bài)
router.post(
  '/tests/:testId/submit',
  authenticateToken,
  recruitmentController.submitTest
);

module.exports = router;