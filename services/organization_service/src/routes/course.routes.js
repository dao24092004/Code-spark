const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticateToken } = require('../middleware/auth');

// Lấy danh sách khóa học của tổ chức
router.get(
  '/organizations/:orgId/courses',
  authenticateToken,
  courseController.getCoursesByOrganization
);

module.exports = router;