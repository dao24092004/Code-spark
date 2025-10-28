// file: proctoring-service/src/routes/proctoring.routes.js

const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoring.controller');

// <<< BƯỚC 1: MỞ LẠI DÒNG NÀY >>>
const { authenticateToken, checkPermission } = require('../middleware/auth');

// === CÁC ROUTE CŨ CỦA BẠN ===

// Lấy lịch sử vi phạm (cho 1 sinh viên/session)
router.get(
  '/sessions/:sessionId/events', 
  authenticateToken, // <<< MỞ LẠI
  // checkPermission('proctoring:events:read'), 
  proctoringController.getEventsBySession
);

// Bắt đầu một phiên giám sát (sinh viên gọi khi bắt đầu)
router.post(
  '/sessions/start-monitoring', 
  authenticateToken, // <<< MỞ LẠI
  proctoringController.startProctoringSession
);


// === BỔ SUNG: API MỚI CHO GIÁM THỊ (PROCTOR FRONTEND) ===

// Lấy tất cả các phiên thi (của sinh viên) đang hoạt động
router.get(
  '/sessions/active',
  authenticateToken, // <<< MỞ LẠI
  // checkPermission('proctoring:session:read'), 
  proctoringController.getActiveSessions
);

// Lấy tất cả sinh viên đang thi trong MỘT kỳ thi
router.get(
  '/exams/:examId/students',
  authenticateToken, // <<< MỞ LẠI
  // checkPermission('proctoring:session:read'), 
  proctoringController.getStudentsInExam
);

// <<< BƯỚC 2: XÓA API TEST GIẢ LẬP ĐI >>>
// (Route /test-alert/:examId đã được xóa khỏi đây)

module.exports = router;