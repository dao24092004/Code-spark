const db = require('../models');
const MultisigWallet = db.MultisigWallet;
const MultisigTransaction = db.MultisigTransaction;
const blockchainService = require('./blockchain.service.js');
const { account, web3 } = require('../config/web3'); // Lấy service account và web3

// Hàm giả lập lấy user ID từ token (sẽ được thay thế bằng middleware)
const getUserIdFromToken = (req) => {
    // TODO: Triển khai JWT middleware để giải mã token
    // Tạm thời hardcode
    return "123e4567-e89b-12d3-a456-426614174000"; // UUID Giả
};

// API: Tạo ví mới
const createWallet = async (req) => {
    const { name, description, owners, threshold } = req.body;
    const creatorId = getUserIdFromToken(req);

    // KIỂM TRA QUAN TRỌNG: Đảm bảo service account là một owner
    const serviceAddress = account.address;
    if (!owners.some(owner => owner.toLowerCase() === serviceAddress.toLowerCase())) {
        throw new Error(`Service Account ${serviceAddress} phải nằm trong danh sách owners để ký giao dịch`);
    }
    
    // 1. Deploy lên Blockchain
    const contractAddress = await blockchainService.deployMultisigContract(owners, threshold);
    
    // 2. Lưu vào DB
    const newWallet = await MultisigWallet.create({
        creatorId,
        name,
        description,
        contractAddress,
        owners,
        threshold
    });
    
    return newWallet;
};

// API: Liên kết ví đã có
const linkWallet = async (req) => {
    const { name, description, contractAddress } = req.body;
    const creatorId = getUserIdFromToken(req);

    // 1. Kiểm tra ví trên chain
    const onChainData = await blockchainService.getOnChainWalletDetails(contractAddress);
    
    // 2. Lưu vào DB
    const linkedWallet = await MultisigWallet.create({
        creatorId,
        name,
        description,
        contractAddress,
        owners: onChainData.owners,
        threshold: onChainData.threshold
    });
    
    return linkedWallet;
};

// API: Lấy ví (kết hợp DB và On-chain)
const getWalletById = async (walletId) => {
    const wallet = await MultisigWallet.findByPk(walletId);
    if (!wallet) {
        throw new Error('Không tìm thấy ví trong DB');
    }
    
    // Lấy thêm data on-chain (ví dụ: số dư)
    const onChainData = await blockchainService.getOnChainWalletDetails(wallet.contractAddress);
    
    // Kết hợp 2 nguồn dữ liệu
    return {
        ...wallet.toJSON(),
        onChainBalance: onChainData.balance
    };
};

// API: Tạo (Submit) một giao dịch mới
const submitNewTransaction = async (walletId, body) => {
    const { destination, value, data } = body;
    const wallet = await MultisigWallet.findByPk(walletId);
    if (!wallet) throw new Error('Không tìm thấy ví');

    const valueInWei = web3.utils.toWei(value.toString(), 'ether');
    
    // 1. Submit lên chain
    const { txHash, txIndexOnChain } = await blockchainService.submitTransaction(
        wallet.contractAddress,
        destination,
        valueInWei,
        data || '0x'
    );

    // 2. Lưu vào DB
    const newTx = await MultisigTransaction.create({
        walletId: wallet.id,
        txIndexOnChain: txIndexOnChain,
        txHash: txHash,
        destination: destination,
        value: valueInWei,
        data: data || '0x',
        status: 'submitted', // Đã submit
        confirmations: [] // Chưa ai confirm
    });
    return newTx;
};

// API: Xác nhận một giao dịch (bằng Service Account)
const confirmExistingTransaction = async (transactionId) => {
    const tx = await MultisigTransaction.findOne({
        where: { id: transactionId },
        include: 'wallet'
    });
    if (!tx) throw new Error('Không tìm thấy giao dịch');
    if (tx.status === 'executed') throw new Error('Giao dịch đã được thực thi');

    const serviceAddress = account.address;
    if (tx.confirmations.includes(serviceAddress)) {
        throw new Error('Service account đã xác nhận giao dịch này');
    }

    // 1. Gửi confirm lên chain
    const txHash = await blockchainService.confirmTransaction(
        tx.wallet.contractAddress,
        tx.txIndexOnChain
    );

    // 2. Cập nhật DB
    const updatedConfirmations = [...tx.confirmations, serviceAddress];
    tx.confirmations = updatedConfirmations;
    tx.status = 'confirmed';
    tx.txHash = txHash; // Cập nhật hash của tx confirm mới nhất
    
    await tx.save();
    return tx;
};

// API: Thực thi một giao dịch (bằng Service Account)
const executeExistingTransaction = async (transactionId) => {
    const tx = await MultisigTransaction.findOne({
        where: { id: transactionId },
        include: 'wallet'
    });
    if (!tx) throw new Error('Không tìm thấy giao dịch');
    if (tx.status === 'executed') throw new Error('Giao dịch đã được thực thi');

    // Kiểm tra DB xem đủ confirm chưa
    if (tx.confirmations.length < tx.wallet.threshold) {
        throw new Error(`Chưa đủ số lượng xác nhận. Cần ${tx.wallet.threshold}, mới có ${tx.confirmations.length}`);
    }

    // 1. Gửi execute lên chain
    const txHash = await blockchainService.executeTransaction(
        tx.wallet.contractAddress,
        tx.txIndexOnChain
    );
    
    // 2. Cập nhật DB
    tx.status = 'executed';
    tx.txHash = txHash;
    await tx.save();
    return tx;
};

// API: Lấy danh sách giao dịch của 1 ví
const getTransactionsForWallet = async (walletId) => {
    return MultisigTransaction.findAll({
        where: { walletId: walletId },
        order: [['createdAt', 'DESC']]
    });
};


module.exports = {
    createWallet,
    linkWallet,
    getWalletById,
    submitNewTransaction,
    confirmExistingTransaction,
    executeExistingTransaction,
    getTransactionsForWallet
};