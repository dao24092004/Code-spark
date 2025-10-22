// file: src/routes/instructor.quiz.routes.js
const express = require('express');
const router = express.Router();
const instructorQuizController = require('../controllers/instructor.quiz.controller');

router.post('/answers/:answerId/grade', instructorQuizController.gradeAnswer);
module.exports = router;