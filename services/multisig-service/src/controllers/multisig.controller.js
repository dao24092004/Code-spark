const multisigService = require('../services/multisig.service');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/multisig
const createNewWallet = asyncHandler(async (req, res) => {
    const { name, owners, threshold } = req.body;
    if (!name || !owners || !threshold) {
        return res.status(400).json({ error: 'Thiếu name, owners hoặc threshold' });
    }
    // req được truyền vào để service có thể lấy creatorId
    const wallet = await multisigService.createWallet(req); 
    res.status(201).json(wallet);
});

// POST /api/v1/multisig/link
const linkExistingWallet = asyncHandler(async (req, res) => {
    const { name, contractAddress } = req.body;
    if (!name || !contractAddress) {
        return res.status(400).json({ error: 'Thiếu name hoặc contractAddress' });
    }
    const wallet = await multisigService.linkWallet(req);
    res.status(201).json(wallet);
});

// GET /api/v1/multisig/:id
const getWallet = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const wallet = await multisigService.getWalletById(id);
    res.status(200).json(wallet);
});

// GET /api/v1/multisig/:walletId/transactions
const getTransactions = asyncHandler(async (req, res) => {
    const { walletId } = req.params;
    const transactions = await multisigService.getTransactionsForWallet(walletId);
    res.status(200).json(transactions);
});

// POST /api/v1/multisig/:walletId/transactions
const submitTransaction = asyncHandler(async (req, res) => {
    const { walletId } = req.params;
    const { destination, value } = req.body;
     if (!destination || value === undefined) {
        return res.status(400).json({ error: 'Thiếu destination hoặc value' });
    }
    const tx = await multisigService.submitNewTransaction(walletId, req.body);
    res.status(201).json(tx);
});

// POST /api/v1/multisig/transactions/:txId/confirm
const confirmTransaction = asyncHandler(async (req, res) => {
    const { txId } = req.params; // Đây là UUID của transaction trong DB
    // Nhận privateKey từ body (optional - nếu không có sẽ dùng Service Account)
    const { privateKey } = req.body;
    const tx = await multisigService.confirmExistingTransaction(txId, privateKey);
    res.status(200).json(tx);
});

// GET /api/v1/multisig/transactions/:txId
const getTransaction = asyncHandler(async (req, res) => {
    const { txId } = req.params;
    const tx = await multisigService.getTransactionById(txId);
    res.status(200).json(tx);
});

// POST /api/v1/multisig/transactions/:txId/execute
const executeTransaction = asyncHandler(async (req, res) => {
    const { txId } = req.params; // Đây là UUID của transaction trong DB
    const tx = await multisigService.executeExistingTransaction(txId);
    res.status(200).json(tx);
});


module.exports = {
    createNewWallet,
    linkExistingWallet,
    getWallet,
    getTransactions,
    submitTransaction,
    getTransaction,
    confirmTransaction,
    executeTransaction
};

