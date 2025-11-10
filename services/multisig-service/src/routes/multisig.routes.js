const express = require('express');
const router = express.Router();
const controller = require('../controllers/multisig.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middleware/auth');

// --- Quản lý Ví (Wallet) ---
// Tạo ví mới - yêu cầu authentication
router.post('/', authenticateToken, controller.createNewWallet);
// Liên kết ví hiện có - yêu cầu authentication
router.post('/link', authenticateToken, controller.linkExistingWallet);
// Lấy thông tin ví - yêu cầu authentication
router.get('/:id', authenticateToken, controller.getWallet);

// --- Quản lý Giao dịch (Transaction) ---

// Lấy danh sách giao dịch của 1 ví - yêu cầu authentication
router.get('/:walletId/transactions', authenticateToken, controller.getTransactions);

// Tạo (Submit) 1 giao dịch mới cho ví - yêu cầu authentication
router.post('/:walletId/transactions', authenticateToken, controller.submitTransaction);

// Lấy thông tin 1 giao dịch (txId là UUID của DB) - yêu cầu authentication
router.get('/transactions/:txId', authenticateToken, controller.getTransaction);

// Xác nhận 1 giao dịch (txId là UUID của DB) - yêu cầu authentication
router.post('/transactions/:txId/confirm', authenticateToken, controller.confirmTransaction);

// Thực thi 1 giao dịch (txId là UUID của DB) - yêu cầu authentication
router.post('/transactions/:txId/execute', authenticateToken, controller.executeTransaction);


module.exports = router;

