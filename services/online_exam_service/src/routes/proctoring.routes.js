// file: src/routes/proctoring.routes.js

const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth.middleware');
const proctoringMonitoringController = require('../controllers/proctoring.monitoring.controller');

router.get(
  '/active-sessions',
  authenticateToken,
  proctoringMonitoringController.getActiveProctoredStudents
);

module.exports = router;

