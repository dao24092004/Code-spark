const express = require('express');
const router = express.Router();
const multisigController = require('../controllers/multisig.controller');

// Wallet Management Routes
router.post('/wallets', multisigController.createNewWallet);
router.post('/wallets/link', multisigController.linkExistingWallet);
router.get('/wallets', multisigController.getAllWallets);
router.get('/wallets/:walletId', multisigController.getWallet);

// Transaction Routes cho một ví cụ thể
router.post('/wallets/:walletId/transactions', multisigController.submitTransaction);
router.get('/wallets/:walletId/transactions', multisigController.getTransactions);

// Transaction Management Routes
router.get('/transactions/:txId', multisigController.getTransaction);
router.post('/transactions/:txId/confirm', multisigController.confirmTransaction);
router.post('/transactions/:txId/execute', multisigController.executeTransaction);

module.exports = router;

