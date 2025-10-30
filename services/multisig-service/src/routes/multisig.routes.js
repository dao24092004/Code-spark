const express = require('express');
const router = express.Router();
const controller = require('../controllers/multisig.controller');
// const authMiddleware = require('../middlewares/auth.js'); // Sẽ thêm sau

// --- Quản lý Ví (Wallet) ---
// (Giả sử đã có authMiddleware)
router.post('/', controller.createNewWallet);
router.post('/link', controller.linkExistingWallet);
router.get('/:id', controller.getWallet);

// --- Quản lý Giao dịch (Transaction) ---

// Lấy danh sách giao dịch của 1 ví
router.get('/:walletId/transactions', controller.getTransactions);

// Tạo (Submit) 1 giao dịch mới cho ví
router.post('/:walletId/transactions', controller.submitTransaction);

// Xác nhận 1 giao dịch (txId là UUID của DB)
router.post('/transactions/:txId/confirm', controller.confirmTransaction);

// Thực thi 1 giao dịch (txId là UUID của DB)
router.post('/transactions/:txId/execute', controller.executeTransaction);


module.exports = router;