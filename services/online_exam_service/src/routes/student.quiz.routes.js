// file: src/routes/student.quiz.routes.js

const express = require('express');
const router = express.Router();
const studentQuizController = require('../controllers/student.quiz.controller');

// Route để bắt đầu bài thi
router.post('/:quizId/start', studentQuizController.startQuiz);

// <<< BỔ SUNG DÒNG NÀY >>>
// Route để nộp bài thi
//router.post('/submissions/:submissionId/submit', studentQuizController.submitQuiz);

module.exports = router;