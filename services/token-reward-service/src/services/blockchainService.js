 // src/services/blockchainService.js
const { ethers } = require('ethers');
require('dotenv').config();

// Lấy ABI (mô tả contract) từ file tạo ra lúc biên dịch
const tokenArtifact = require('../../artifacts/contracts/Token.sol/Token.json');
const tokenABI = tokenArtifact.abi;

const { WEB3_PROVIDER_URL, ACCOUNT_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

// 1. Thiết lập kết nối với Ganache
const provider = new ethers.JsonRpcProvider(WEB3_PROVIDER_URL);

// 2. Thiết lập ví của server (dùng để ký và gửi giao dịch)
const serverWallet = new ethers.Wallet(ACCOUNT_PRIVATE_KEY, provider);

// 3. Thiết lập đối tượng Contract
const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, tokenABI, serverWallet);

const blockchainService = {
    /**
     * Gửi token ERC-20 từ ví server đến ví người dùng.
     */
    transferTokens: async (toAddress, amount) => {
        try {
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
