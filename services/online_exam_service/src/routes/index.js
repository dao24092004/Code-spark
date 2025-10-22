// file: src/routes/index.js
const express = require('express');
const router = express.Router();

const studentQuizRoutes = require('./student.quiz.routes');
const instructorQuizRoutes = require('./instructor.quiz.routes'); // <<< IMPORT ROUTE MỚI
const submissionRoutes = require('./submission.routes'); // <-- IMPORT THÊM

// Gắn các routes con vào router chính
router.use('/quizzes', studentQuizRoutes);
router.use('/instructor/quizzes', instructorQuizRoutes); // <<< SỬ DỤNG ROUTE MỚI
router.use('/submissions', submissionRoutes); // <-- SỬ DỤNG ROUTE MỚI

module.exports = router;