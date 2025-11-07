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
    
    // 2. Fund ETH vào contract wallet (mặc định 500 ETH)
    // Có thể config qua environment variable INITIAL_WALLET_BALANCE_ETH
    const initialBalanceEth = parseFloat(process.env.INITIAL_WALLET_BALANCE_ETH) || 500;
    try {
        await blockchainService.fundContractWallet(contractAddress, initialBalanceEth);
        console.log(`✅ Đã fund ${initialBalanceEth} ETH vào contract wallet ${contractAddress}`);
    } catch (error) {
        console.warn(`⚠️  Không thể fund ETH vào contract wallet: ${error.message}`);
        console.warn(`   Contract wallet sẽ có balance = 0 ETH. Bạn cần fund thủ công sau.`);
        // Không throw error để vẫn tạo được ví, chỉ cảnh báo
    }
    
    // 3. Lưu vào DB
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
    // Nếu không lấy được on-chain data, vẫn return data từ DB
    let onChainBalance = '0';
    let onChainError = null;
    
    try {
        const onChainData = await blockchainService.getOnChainWalletDetails(wallet.contractAddress);
        onChainBalance = onChainData.balance;
    } catch (error) {
        console.warn(`Không thể lấy on-chain data cho wallet ${walletId}:`, error.message);
        onChainError = error.message;
        // Vẫn return data từ DB, nhưng có cảnh báo
    }
    
    // Kết hợp 2 nguồn dữ liệu
    const result = {
        ...wallet.toJSON(),
        onChainBalance: onChainBalance
    };
    
    // Nếu có lỗi, thêm thông tin lỗi vào response để user biết
    if (onChainError) {
        result.onChainError = onChainError;
        result.onChainWarning = 'Không thể lấy dữ liệu từ blockchain. Chỉ hiển thị dữ liệu từ database.';
    }
    
    return result;
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

// API: Xác nhận một giao dịch
// privateKey: (optional) Private key của owner muốn confirm. Nếu không có, dùng Service Account
const confirmExistingTransaction = async (transactionId, privateKey = null) => {
    const tx = await MultisigTransaction.findOne({
        where: { id: transactionId },
        include: 'wallet'
    });
    if (!tx) throw new Error('Không tìm thấy giao dịch');
    if (tx.status === 'executed') throw new Error('Giao dịch đã được thực thi');

    // Xác định account sẽ dùng để confirm
    let confirmAccount;
    let confirmerAddress;
    
    if (privateKey) {
        // Tạo account từ private key (có thể có hoặc không có prefix "0x")
        const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
        confirmAccount = web3.eth.accounts.privateKeyToAccount(privateKeyWithPrefix);
        // Đảm bảo private key có trong account object để sign transaction
        if (!confirmAccount.privateKey) {
            confirmAccount.privateKey = privateKeyWithPrefix;
        }
        confirmerAddress = confirmAccount.address.toLowerCase();
        
        // Kiểm tra owner có trong danh sách owners không
        const wallet = tx.wallet;
        const isOwner = wallet.owners.some(owner => 
            owner.toLowerCase() === confirmerAddress
        );
        
        if (!isOwner) {
            throw new Error(`Địa chỉ ${confirmerAddress} không phải là owner của ví này`);
        }
        
        // Kiểm tra đã confirm chưa
        const hasConfirmed = tx.confirmations.some(conf => 
            conf.toLowerCase() === confirmerAddress
        );
        
        if (hasConfirmed) {
            throw new Error(`Địa chỉ ${confirmerAddress} đã xác nhận giao dịch này rồi`);
        }
    } else {
        // Dùng Service Account (như cũ)
        confirmAccount = account;
        confirmerAddress = account.address.toLowerCase();
        
        if (tx.confirmations.some(conf => conf.toLowerCase() === confirmerAddress)) {
            throw new Error('Service account đã xác nhận giao dịch này');
        }
    }

    // 1. Gửi confirm lên chain với account tương ứng
    const txHash = await blockchainService.confirmTransaction(
        tx.wallet.contractAddress,
        tx.txIndexOnChain,
        confirmAccount  // Truyền account để sign
    );

    // 2. Cập nhật DB với address của owner đã confirm
    const updatedConfirmations = [...tx.confirmations, confirmerAddress];
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

    // Kiểm tra balance của contract wallet trước khi execute
    const contractBalance = await web3.eth.getBalance(tx.wallet.contractAddress);
    const valueInWei = BigInt(tx.value);
    
    if (contractBalance < valueInWei) {
        const balanceEth = web3.utils.fromWei(contractBalance.toString(), 'ether');
        const valueEth = web3.utils.fromWei(tx.value.toString(), 'ether');
        throw new Error(`Contract wallet không đủ ETH để thực thi giao dịch. Balance: ${balanceEth} ETH, Cần: ${valueEth} ETH. Vui lòng fund contract wallet trước.`);
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

// API: Lấy thông tin 1 giao dịch theo ID
const getTransactionById = async (transactionId) => {
    const tx = await MultisigTransaction.findOne({
        where: { id: transactionId },
        include: 'wallet'
    });
    if (!tx) throw new Error('Không tìm thấy giao dịch');
    return tx;
};


module.exports = {
    createWallet,
    linkWallet,
    getWalletById,
    submitNewTransaction,
    confirmExistingTransaction,
    executeExistingTransaction,
    getTransactionsForWallet,
    getTransactionById
};

