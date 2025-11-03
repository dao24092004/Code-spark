const db = require('../models');
const MultisigWallet = db.MultisigWallet;
const MultisigTransaction = db.MultisigTransaction;
const blockchainService = require('./blockchain.service');

/**
 * Tạo ví multisig mới
 */
async function createWallet(req) {
  const { name, description, owners, threshold } = req.body;
  
  // Validation
  if (!name || !owners || !threshold) {
    throw new Error('Name, owners, and threshold are required');
  }

  if (!Array.isArray(owners) || owners.length === 0) {
    throw new Error('Owners must be a non-empty array');
  }

  if (threshold < 1 || threshold > owners.length) {
    throw new Error(`Threshold must be between 1 and ${owners.length}`);
  }

  // Validate Ethereum addresses
  for (const owner of owners) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
      throw new Error(`Invalid Ethereum address: ${owner}`);
    }
  }

  // 1. Deploy contract lên blockchain
  const deployerPrivateKey = req.body.deployerPrivateKey || process.env.DEPLOYER_PRIVATE_KEY;
  const deployerAddress = req.body.deployerAddress || process.env.DEPLOYER_ADDRESS;
  
  let retries = 3;
  let contractAddress;
  let lastError;
  
  while (retries > 0) {
    try {
      contractAddress = await blockchainService.deployMultisigContract(
        owners,
        threshold,
        {
          from: deployerAddress,
          privateKey: deployerPrivateKey
        }
      );
      break; // Nếu thành công thì thoát vòng lặp
    } catch (error) {
      lastError = error;
      console.warn(`Deployment attempt failed (${retries} retries left):`, error.message);
      retries--;
      if (retries > 0) {
        // Đợi 2 giây trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  if (!contractAddress) {
    throw new Error(`Failed to deploy contract after multiple attempts: ${lastError.message}`);
  }

  // 2. Lưu vào database
    owners,
    threshold,
    {
      from: deployerAddress,
      privateKey: deployerPrivateKey
    }
  );

  // 2. Lưu vào database
  const creatorId = req.user?.id || req.user?.userId || req.body.creatorId || null;
  
  const newWallet = await MultisigWallet.create({
    name,
    description: description || null,
    contractAddress,
    owners,
    threshold,
    creatorId
  });

  // 3. Lấy thông tin on-chain (balance)
  try {
    const onChainData = await blockchainService.getOnChainWalletDetails(contractAddress);
    return {
      ...newWallet.toJSON(),
      balance: onChainData.balance
    };
  } catch (error) {
    console.warn('Could not fetch on-chain balance:', error.message);
    return {
      ...newWallet.toJSON(),
      balance: '0.0'
    };
  }
}

/**
 * Liên kết ví đã có (không deploy mới)
 */
async function linkWallet(req) {
  const { name, description, contractAddress } = req.body;
  
  if (!name || !contractAddress) {
    throw new Error('Name and contractAddress are required');
  }

  // Validate address
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    throw new Error('Invalid contract address');
  }

  // 1. Kiểm tra ví trên chain
  const onChainData = await blockchainService.getOnChainWalletDetails(contractAddress);
  
  // 2. Kiểm tra ví đã tồn tại trong DB chưa
  const existingWallet = await MultisigWallet.findOne({
    where: { contractAddress }
  });

  if (existingWallet) {
    throw new Error('Wallet already linked');
  }

  // 3. Lưu vào DB
  const creatorId = req.user?.id || req.user?.userId || req.body.creatorId || null;
  
  const linkedWallet = await MultisigWallet.create({
    name,
    description: description || null,
    contractAddress,
    owners: onChainData.owners,
    threshold: onChainData.threshold,
    creatorId
  });

  return {
    ...linkedWallet.toJSON(),
    balance: onChainData.balance
  };
}

/**
 * Lấy thông tin ví
 */
async function getWalletById(walletId) {
  if (!walletId) {
    throw new Error('Wallet ID is required');
  }

  console.log(`Fetching wallet details for ID: ${walletId}`);
  
  const wallet = await MultisigWallet.findByPk(walletId, {
    include: [{
      model: MultisigTransaction,
      as: 'transactions',
      where: { status: ['submitted', 'confirmed', 'executing', 'executed'] }, // Exclude failed transactions
      order: [['created_at', 'DESC']],
      limit: 10 // Latest 10 transactions
    }]
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Lấy thông tin on-chain
  try {
    const onChainData = await blockchainService.getOnChainWalletDetails(wallet.contractAddress);
    return {
      ...wallet.toJSON(),
      balance: onChainData.balance
    };
  } catch (error) {
    console.warn('Could not fetch on-chain data:', error.message);
    return {
      ...wallet.toJSON(),
      balance: '0.0'
    };
  }
}

/**
 * Lấy danh sách ví
 */
async function getAllWallets(query = {}) {
  const { creatorId, limit = 50, offset = 0 } = query;
  
  const where = {};
  if (creatorId) {
    where.creatorId = creatorId;
  }

  const wallets = await MultisigWallet.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  // Fetch balances
  const walletsWithBalance = await Promise.all(
    wallets.rows.map(async (wallet) => {
      try {
        const onChainData = await blockchainService.getOnChainWalletDetails(wallet.contractAddress);
        return {
          ...wallet.toJSON(),
          balance: onChainData.balance
        };
      } catch (error) {
        return {
          ...wallet.toJSON(),
          balance: '0.0'
        };
      }
    })
  );

  return {
    count: wallets.count,
    rows: walletsWithBalance
  };
}

/**
 * Submit một transaction mới
 */
async function submitNewTransaction(walletId, body) {
  const { destination, value, data, from, privateKey } = body;
  
  if (!destination || value === undefined) {
    throw new Error('Destination and value are required');
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(destination)) {
    throw new Error('Invalid destination address');
  }

  // Get wallet
  const wallet = await MultisigWallet.findByPk(walletId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (!from || !wallet.owners.includes(from.toLowerCase())) {
    throw new Error('From address must be one of the wallet owners');
  }

  // Kiểm tra giá trị giao dịch
  if (parseFloat(value) <= 0) {
    throw new Error('Transaction value must be greater than 0');
  }

  // Convert value to Wei
  const { web3 } = require('../config/web3');
  const valueInWei = web3.utils.toWei(value.toString(), 'ether');

  // Kiểm tra số dư của ví
  const walletDetails = await blockchainService.getOnChainWalletDetails(wallet.contractAddress);
  const balanceInWei = web3.utils.toWei(walletDetails.balance, 'ether');
  if (BigInt(valueInWei) > BigInt(balanceInWei)) {
    throw new Error('Insufficient wallet balance');
  }

  // 1. Submit lên blockchain
  const result = await blockchainService.submitTransaction(
    wallet.contractAddress,
    destination,
    valueInWei,
    data || '0x',
    { from, privateKey }
  );

  // 2. Lưu vào DB
  const newTx = await MultisigTransaction.create({
    walletId: wallet.id,
    txIndexOnChain: result.txIndexOnChain,
    txHash: result.txHash,
    destination,
    value: valueInWei,
    data: data || '0x',
    status: 'submitted',
    confirmations: []
  });

  return newTx.toJSON();
}

/**
 * Confirm một transaction
 */
async function confirmExistingTransaction(transactionId, options = {}) {
  const { from, privateKey } = options;
  
  const tx = await MultisigTransaction.findByPk(transactionId, {
    include: [{
      model: MultisigWallet,
      as: 'wallet'
    }]
  });

  if (!tx) {
    throw new Error('Transaction not found');
  }

  if (tx.status === 'executed') {
    throw new Error('Transaction already executed');
  }

  if (!from) {
    throw new Error('From address is required');
  }

  // Verify from address is an owner
  const wallet = tx.wallet;
  if (!wallet.owners.includes(from.toLowerCase())) {
    throw new Error('From address must be one of the wallet owners');
  }

  // Check if already confirmed
  if (tx.confirmations.includes(from.toLowerCase())) {
    throw new Error('Transaction already confirmed by this address');
  }

  // 1. Confirm trên blockchain
  const txHash = await blockchainService.confirmTransaction(
    wallet.contractAddress,
    tx.txIndexOnChain,
    { from, privateKey }
  );

  // 2. Cập nhật DB
  const updatedConfirmations = [...tx.confirmations, from.toLowerCase()];
  const newStatus = updatedConfirmations.length >= wallet.threshold ? 'confirmed' : 'submitted';
  
  try {
    await tx.update({
      confirmations: updatedConfirmations,
      status: newStatus,
      txHash: txHash, // Update với hash mới nhất
      lastError: null // Clear any previous errors
    });

    // Emit event nếu transaction đã được confirmed
    if (newStatus === 'confirmed') {
      // Có thể thêm logic để gửi notification ở đây
      console.log(`Transaction ${transactionId} is now fully confirmed`);
    }

    return tx.reload();
  } catch (error) {
    // Log error và update trạng thái
    console.error('Error confirming transaction:', error);
    await tx.update({
      status: 'failed',
      lastError: error.message
    });
    throw error;
  }
}

/**
 * Execute một transaction
 */
async function executeExistingTransaction(transactionId, options = {}) {
  const { from, privateKey } = options;
  
  const tx = await MultisigTransaction.findByPk(transactionId, {
    include: [{
      model: MultisigWallet,
      as: 'wallet'
    }]
  });

  if (!tx) {
    throw new Error('Transaction not found');
  }

  if (tx.status === 'executed') {
    throw new Error('Transaction already executed');
  }

  const wallet = tx.wallet;

  // Verify đủ confirmations
  if (tx.confirmations.length < wallet.threshold) {
    throw new Error(
      `Not enough confirmations. Required: ${wallet.threshold}, Current: ${tx.confirmations.length}`
    );
  }

  if (!from) {
    throw new Error('From address is required');
  }

  // Verify from address is an owner
  if (!wallet.owners.includes(from.toLowerCase())) {
    throw new Error('From address must be one of the wallet owners');
  }

  // 1. Execute trên blockchain
  const txHash = await blockchainService.executeTransaction(
    wallet.contractAddress,
    tx.txIndexOnChain,
    { from, privateKey }
  );

  // 2. Cập nhật DB
  try {
    // Đánh dấu là đang thực thi
    await tx.update({
      status: 'executing',
      lastError: null
    });

    // Thực thi giao dịch
    const executionResult = await tx.update({
      status: 'executed',
      txHash: txHash,
      executedAt: new Date(),
      executedBy: from.toLowerCase()
    });

    // Cập nhật balance của ví (có thể thêm vào sau)
    await wallet.reload();

    return executionResult;
  } catch (error) {
    // Log error và update trạng thái
    console.error('Error executing transaction:', error);
    await tx.update({
      status: 'failed',
      lastError: error.message
    });
    throw error;
  }
}

/**
 * Lấy danh sách transactions của một ví
 */
async function getTransactionsForWallet(walletId, query = {}) {
  const { limit = 50, offset = 0, status } = query;
  
  const where = { walletId };
  if (status) {
    where.status = status;
  }

  return MultisigTransaction.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
    include: [{
      model: MultisigWallet,
      as: 'wallet',
      attributes: ['id', 'name', 'contractAddress', 'threshold']
    }]
  });
}

/**
 * Lấy thông tin transaction
 */
async function getTransactionById(transactionId) {
  const tx = await MultisigTransaction.findByPk(transactionId, {
    include: [{
      model: MultisigWallet,
      as: 'wallet'
    }]
  });

  if (!tx) {
    throw new Error('Transaction not found');
  }

  return tx;
}

module.exports = {
  createWallet,
  linkWallet,
  getWalletById,
  getAllWallets,
  submitNewTransaction,
  confirmExistingTransaction,
  executeExistingTransaction,
  getTransactionsForWallet,
  getTransactionById
};

