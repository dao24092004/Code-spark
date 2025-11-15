 // src/services/blockchainService.js
const { ethers } = require('ethers');
require('dotenv').config();

// Lấy ABI (mô tả contract) từ file tạo ra lúc biên dịch
const tokenArtifact = require('../../artifacts/contracts/Token.sol/Token.json');
const tokenABI = tokenArtifact.abi;

let escrowABI = null;
try {
    const escrowArtifact = require('../../artifacts/contracts/RewardEscrow.sol/RewardEscrow.json');
    escrowABI = escrowArtifact.abi;
} catch (error) {
    escrowABI = [
        "function release(address recipient, uint256 amount, bytes32 requestId) external returns (bytes32)",
        "function claimWithdrawal(address recipient, uint256 amount, bytes32 requestId) external returns (bytes32)",
        "event WithdrawalReleased(bytes32 indexed requestId, address indexed operator, address indexed recipient, uint256 amount)"
    ];
}

const {
    WEB3_PROVIDER_URL,
    ACCOUNT_PRIVATE_KEY,
    CONTRACT_ADDRESS,
    ESCROW_CONTRACT_ADDRESS
} = process.env;

// 1. Thiết lập kết nối với Ganache
let provider = null;
let serverWallet = null;
let tokenContract = null;
let escrowContract = null;

try {
    if (WEB3_PROVIDER_URL && ACCOUNT_PRIVATE_KEY) {
        // Clean private key - remove any prefix or extra characters
        const cleanPrivateKey = ACCOUNT_PRIVATE_KEY.replace(/^ACCOUNT_PRIVATE_KEY=/, '').trim();
        if (!cleanPrivateKey || cleanPrivateKey.length < 40) {
            throw new Error('Invalid private key format');
        }
        provider = new ethers.JsonRpcProvider(WEB3_PROVIDER_URL);
        serverWallet = new ethers.Wallet(cleanPrivateKey, provider);
        
        if (CONTRACT_ADDRESS) {
            // 3. Thiết lập đối tượng Contract
            tokenContract = new ethers.Contract(CONTRACT_ADDRESS, tokenABI, serverWallet);
            console.log('✅ Blockchain service initialized with contract address:', CONTRACT_ADDRESS);
        } else {
            console.warn('⚠️  CONTRACT_ADDRESS not set. Blockchain features will be disabled. Deploy contract first.');
        }

        if (ESCROW_CONTRACT_ADDRESS) {
            try {
                escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, escrowABI, serverWallet);
                console.log('✅ Escrow contract wired at:', ESCROW_CONTRACT_ADDRESS);
            } catch (escrowError) {
                console.warn('⚠️  Failed to initialize escrow contract:', escrowError.message);
                escrowContract = null;
            }
        }
    } else {
        console.warn('⚠️  Blockchain configuration missing. Blockchain features will be disabled.');
    }
} catch (error) {
    console.error('❌ Error initializing blockchain service:', error.message);
    console.warn('⚠️  Blockchain features will be disabled.');
}

const directTransfer = async (toAddress, amount) => {
    try {
        if (!tokenContract) {
            console.warn('⚠️  Contract not initialized. Skipping blockchain transfer.');
            return { success: false, error: 'Contract not initialized. Please deploy contract first.' };
        }

        console.log(`Bắt đầu chuyển on-chain ${amount} token đến ${toAddress}...`);

        const amountInWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await tokenContract.transfer(toAddress, amountInWei);

        console.log(`Đã gửi giao dịch, hash: ${tx.hash}. Đang chờ xác nhận...`);
        await tx.wait();

        console.log('✅ Giao dịch on-chain thành công!');
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error('❌ Lỗi khi chuyển token on-chain:', error.message);
        return { success: false, error: error.message };
    }
};

const blockchainService = {
    transferTokens: directTransfer,

    disburseTokens: async (toAddress, amount, options = {}) => {
        if (!tokenContract) {
            return { success: false, error: 'Token contract not initialized' };
        }

        const amountInWei = ethers.parseUnits(amount.toString(), 18);
        const requestIdInput = options.requestId || null;
        const requestIdBytes = requestIdInput ? ethers.id(requestIdInput.toString()) : ethers.ZeroHash;

        if (escrowContract) {
            try {
                let tx;
                if (typeof escrowContract.release === 'function') {
                    tx = await escrowContract.release(toAddress, amountInWei, requestIdBytes);
                } else if (typeof escrowContract.claimWithdrawal === 'function') {
                    tx = await escrowContract.claimWithdrawal(toAddress, amountInWei, requestIdBytes);
                } else {
                    throw new Error('Escrow contract missing release/claimWithdrawal function');
                }

                console.log(`Escrow disburse submitted: ${tx.hash} -> waiting confirmation`);
                await tx.wait();
                return { success: true, txHash: tx.hash, viaEscrow: true };
            } catch (error) {
                console.error('Escrow disburse failed, falling back to direct transfer:', error.message);
                return directTransfer(toAddress, amount);
            }
        }

        return directTransfer(toAddress, amount);
    }
};

module.exports = blockchainService;
