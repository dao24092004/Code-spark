// src/routes/tokenRoutes.js
const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

// Định nghĩa một route: Khi có request POST tới /grant,
// hàm grantTokenHandler trong tokenController sẽ được gọi.
router.post('/grant', tokenController.grantTokenHandler);
// UC27: Tiêu token (mới)
router.post('/spend', tokenController.spendTokenHandler);

// UC28a: Lấy số dư (mới) - dùng param :studentId
router.get('/balance/:studentId', tokenController.getBalanceHandler);

// UC28b: Lấy lịch sử (mới) - dùng param :studentId
router.get('/history/:studentId', tokenController.getHistoryHandler);

router.post('/withdraw', tokenController.withdrawTokenHandler);

module.exports = router; 
