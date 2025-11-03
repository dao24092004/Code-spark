const multisigService = require('../services/multisig.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/wallets
 * Tạo ví multisig mới
 */
const createNewWallet = asyncHandler(async (req, res) => {
  const wallet = await multisigService.createWallet(req);
  res.status(201).json({
    success: true,
    data: wallet,
    message: 'Wallet created successfully'
  });
});

/**
 * POST /api/v1/wallets/link
 * Liên kết ví đã có
 */
const linkExistingWallet = asyncHandler(async (req, res) => {
  const wallet = await multisigService.linkWallet(req);
  res.status(201).json({
    success: true,
    data: wallet,
    message: 'Wallet linked successfully'
  });
});

/**
 * GET /api/v1/wallets
 * Lấy danh sách ví
 */
const getAllWallets = asyncHandler(async (req, res) => {
  const result = await multisigService.getAllWallets(req.query);
  res.status(200).json({
    success: true,
    data: result.rows,
    count: result.count,
    message: 'Wallets retrieved successfully'
  });
});

/**
 * GET /api/v1/wallets/:walletId
 * Lấy thông tin ví
 */
const getWallet = asyncHandler(async (req, res) => {
  const { walletId } = req.params;
  const wallet = await multisigService.getWalletById(walletId);
  res.status(200).json({
    success: true,
    data: wallet,
    message: 'Wallet retrieved successfully'
  });
});

/**
 * GET /api/v1/wallets/:walletId/transactions
 * Lấy danh sách transactions của ví
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { walletId } = req.params;
  const result = await multisigService.getTransactionsForWallet(walletId, req.query);
  res.status(200).json({
    success: true,
    data: result.rows,
    count: result.count,
    message: 'Transactions retrieved successfully'
  });
});

/**
 * POST /api/v1/wallets/:walletId/transactions
 * Submit transaction mới
 */
const submitTransaction = asyncHandler(async (req, res) => {
  const { walletId } = req.params;
  const tx = await multisigService.submitNewTransaction(walletId, req.body);
  res.status(201).json({
    success: true,
    data: tx,
    message: 'Transaction submitted successfully'
  });
});

/**
 * GET /api/v1/transactions/:txId
 * Lấy thông tin transaction
 */
const getTransaction = asyncHandler(async (req, res) => {
  const { txId } = req.params;
  const tx = await multisigService.getTransactionById(txId);
  res.status(200).json({
    success: true,
    data: tx,
    message: 'Transaction retrieved successfully'
  });
});

/**
 * POST /api/v1/transactions/:txId/confirm
 * Confirm transaction
 */
const confirmTransaction = asyncHandler(async (req, res) => {
  const { txId } = req.params;
  const options = {
    from: req.body.from,
    privateKey: req.body.privateKey
  };
  
  const tx = await multisigService.confirmExistingTransaction(txId, options);
  res.status(200).json({
    success: true,
    data: tx,
    message: 'Transaction confirmed successfully'
  });
});

/**
 * POST /api/v1/transactions/:txId/execute
 * Execute transaction
 */
const executeTransaction = asyncHandler(async (req, res) => {
  const { txId } = req.params;
  const options = {
    from: req.body.from,
    privateKey: req.body.privateKey
  };
  
  const tx = await multisigService.executeExistingTransaction(txId, options);
  res.status(200).json({
    success: true,
    data: tx,
    message: 'Transaction executed successfully'
  });
});

module.exports = {
  createNewWallet,
  linkExistingWallet,
  getAllWallets,
  getWallet,
  getTransactions,
  submitTransaction,
  getTransaction,
  confirmTransaction,
  executeTransaction
};

