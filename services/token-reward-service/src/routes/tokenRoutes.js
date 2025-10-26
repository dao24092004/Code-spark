// src/routes/tokenRoutes.js
const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Định nghĩa một route: Khi có request POST tới /grant,
// hàm grantTokenHandler trong tokenController sẽ được gọi.
//router.post('/grant', authenticateToken, checkPermission('token:grant'), tokenController.grantTokenHandler);
router.post('/grant', authenticateToken, tokenController.grantTokenHandler);

// UC27: Tiêu token (mới)
router.post('/spend', authenticateToken, checkPermission('token:spend'), tokenController.spendTokenHandler);

// UC28a: Lấy số dư (mới) - dùng param :studentId
router.get('/balance/:studentId', authenticateToken, checkPermission('token:read:self'), tokenController.getBalanceHandler);

// UC28b: Lấy lịch sử (mới) - dùng param :studentId
router.get('/history/:studentId', authenticateToken, checkPermission('token:read:self'), tokenController.getHistoryHandler);

router.post('/withdraw', authenticateToken, checkPermission('token:withdraw'), tokenController.withdrawTokenHandler);

module.exports = router; 
