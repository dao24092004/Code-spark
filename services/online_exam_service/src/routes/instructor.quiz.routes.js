// file: src/routes/instructor.quiz.routes.js
const express = require('express');
const router = express.Router();
const instructorQuizController = require('../controllers/instructor.quiz.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');

router.post('/answers/:answerId/grade', authenticateToken, checkPermission('grading:manual'), instructorQuizController.gradeAnswer);
module.exports = router;