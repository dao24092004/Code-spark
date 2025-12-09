const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Endpoint: POST /api/v1/ai/consult
router.post('/consult', aiController.consultCourses);

module.exports = router;