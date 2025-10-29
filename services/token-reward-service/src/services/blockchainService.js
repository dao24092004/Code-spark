 // src/services/blockchainService.js
const { ethers } = require('ethers');
require('dotenv').config();

// Lấy ABI (mô tả contract) từ file tạo ra lúc biên dịch
const tokenArtifact = require('../../artifacts/contracts/Token.sol/Token.json');
const tokenABI = tokenArtifact.abi;

const { WEB3_PROVIDER_URL, ACCOUNT_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

// 1. Thiết lập kết nối với Ganache
let provider = null;
let serverWallet = null;
let tokenContract = null;

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
    } else {
        console.warn('⚠️  Blockchain configuration missing. Blockchain features will be disabled.');
    }
} catch (error) {
    console.error('❌ Error initializing blockchain service:', error.message);
    console.warn('⚠️  Blockchain features will be disabled.');
}

const blockchainService = {
    /**
     * Gửi token ERC-20 từ ví server đến ví người dùng.
     */
    transferTokens: async (toAddress, amount) => {
        try {
            if (!tokenContract) {
                console.warn('⚠️  Contract not initialized. Skipping blockchain transfer.');
                return { success: false, error: 'Contract not initialized. Please deploy contract first.' };
            }

            console.log(`Bắt đầu chuyển on-chain ${amount} token đến ${toAddress}...`);

            // Token ERC-20 thường có 18 chữ số thập phân
            const amountInWei = ethers.parseUnits(amount.toString(), 18);

            // Gọi hàm `transfer` của Smart Contract
            const tx = await tokenContract.transfer(toAddress, amountInWei);

            console.log(`Đã gửi giao dịch, hash: ${tx.hash}. Đang chờ xác nhận...`);
            await tx.wait(); // Chờ giao dịch được đào (trên Ganache sẽ rất nhanh)

            console.log(`✅ Giao dịch on-chain thành công!`);
            return { success: true, txHash: tx.hash };

        } catch (error) {
            console.error('❌ Lỗi khi chuyển token on-chain:', error.message);
            return { success: false, error: error.message };
        }
    }
};

module.exports = blockchainService;
