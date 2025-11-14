// file: proctoring-service/src/routes/proctoring.routes.js

const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoring.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Debug: Kiểm tra các handler có được load đúng không
console.log('[ROUTES DEBUG] proctoringController:', typeof proctoringController);
console.log('[ROUTES DEBUG] proctoringController keys:', Object.keys(proctoringController || {}));
console.log('[ROUTES DEBUG] startProctoringSession:', typeof proctoringController.startProctoringSession);
console.log('[ROUTES DEBUG] getEventsBySession:', typeof proctoringController.getEventsBySession);
console.log('[ROUTES DEBUG] authenticateToken:', typeof authenticateToken);

// Kiểm tra handler trước khi sử dụng
if (!proctoringController.startProctoringSession) {
  console.error('[ROUTES ERROR] startProctoringSession is undefined!');
  console.error('[ROUTES ERROR] Available keys:', Object.keys(proctoringController || {}));
}
if (!proctoringController.analyzeFrame) {
  console.error('[ROUTES ERROR] analyzeFrame is undefined!');
  console.error('[ROUTES ERROR] Available keys:', Object.keys(proctoringController || {}));
}

// Route cũ: Để lấy lịch sử vi phạm
router.get('/sessions/:sessionId/events', authenticateToken, checkPermission('proctoring:events:read'), proctoringController.getEventsBySession);

// Route: Lấy tất cả các phiên giám sát đang hoạt động
router.get('/sessions', authenticateToken, proctoringController.getActiveSessions);

// <<< BỔ SUNG >>>
// Route mới: Để nhận lệnh bắt đầu một phiên giám sát từ service khác
//router.post('/sessions/start-monitoring', authenticateToken, checkPermission('proctoring:session:start'), proctoringController.startProctoringSession);
router.post('/sessions/start-monitoring', authenticateToken, proctoringController.startProctoringSession);
router.post(
  '/sessions/:sessionId/terminate',
  authenticateToken,
  checkPermission('PROCTORING_SESSION_TERMINATE'),
  proctoringController.terminateSession
);

router.post(
  '/sessions/:sessionId/complete',
  authenticateToken,
  proctoringController.completeSession
);

router.post(
  '/sessions/:sessionId/warning',
  authenticateToken,
  checkPermission('PROCTORING_SESSION_WARNING'),
  proctoringController.sendWarning
);

// Route để phân tích frame camera bằng AI
// Không cần authentication vì gọi từ frontend thường xuyên (có thể thêm sau nếu cần)
router.post('/analyze-frame', (req, res, next) => {
  console.log('[ROUTE] /analyze-frame called');
  console.log('[ROUTE] Request body keys:', Object.keys(req.body || {}));
  next();
}, proctoringController.analyzeFrame);

router.get('/test', (req, res) => {
  res.json({ 
    message: 'Proctoring service is working through API Gateway!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;