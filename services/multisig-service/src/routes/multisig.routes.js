const express = require('express');
const router = express.Router();
const controller = require('../controllers/multisig.controller');
const userController = require('../controllers/user.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middleware/auth');

// --- Quản lý Ví (Wallet) ---
// Tạo ví mới - yêu cầu authentication
router.post('/', authenticateToken, controller.createNewWallet);
// Liên kết ví hiện có - yêu cầu authentication
router.post('/link', authenticateToken, controller.linkExistingWallet);

// Lấy danh sách tất cả ví - yêu cầu authentication
router.get('/', authenticateToken, controller.getAllWallets);
// Lấy danh sách người dùng có thể tạo ví - yêu cầu authentication
router.get('/users/available', authenticateToken, controller.getAvailableUsers);
// Lấy thông tin ví - yêu cầu authentication
router.get('/:id', authenticateToken, controller.getWallet);

// --- Tích hợp Identity Service ---
router.get('/users', authenticateToken, userController.getAllIdentityUsers);
router.get('/users/profile', authenticateToken, userController.getIdentityUserProfile);
router.get('/users/:userId', authenticateToken, userController.getIdentityUserById);
router.get('/:walletId/owners/me', authenticateToken, userController.getMyOwnerCredential);

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

