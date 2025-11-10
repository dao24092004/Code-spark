const fs = require('fs');
const path = require('path');
const web3 = require('../config/web3'); // Import đối tượng web3 đã kết nối
const config = require('../config/');

// --- TẢI THÔNG TIN CONTRACT ---

// 1. Đọc file ABI đã được biên dịch từ Smart Contract
const abiPath = path.resolve(__dirname, '../contracts/build/src_contracts_GradeLedger_sol_GradeLedger.abi');
if (!fs.existsSync(abiPath)) {
  throw new Error("File ABI không tồn tại! Vui lòng biên dịch Smart Contract trước: solcjs --abi --bin -o src/contracts/build src/contracts/GradeLedger.sol");
}
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// 2. Lấy địa chỉ contract và private key từ file .env qua config
const contractAddress = config.blockchain.contractAddress;
const privateKey = config.blockchain.privateKey;

if (!contractAddress || !privateKey) {
    throw new Error("Vui lòng cung cấp contractAddress và privateKey trong file .env");
}

// 3. Lấy thông tin tài khoản sẽ trả gas từ private key
const account = web3.eth.accounts.privateKeyToAccount(privateKey);

// 4. Tạo đối tượng contract để tương tác
const gradeLedgerContract = new web3.eth.Contract(abi, contractAddress);

/**
 * Ghi điểm số cuối cùng của một bài làm lên Blockchain.
 * @param {string} submissionId - ID của bài làm (dạng UUID string).
 * @param {number} userId - ID của sinh viên.
 * @param {number} score - Điểm số cuối cùng.
 * @returns {Promise<string>} - Transaction hash của giao dịch.
 */
async function recordFinalGrade(submissionId, userId, score) {
  // --- Khối lệnh Debug để kiểm tra giá trị ---
  console.log("\n================ DEBUG BLOCKCHAIN ================");
  console.log("Contract Address:", contractAddress);
  console.log("From Account:", account.address);
  console.log("--- Tham số gửi lên Contract ---");
  console.log("  Submission ID (string):", submissionId, `(kiểu: ${typeof submissionId})`);
  console.log("  User ID (number):", userId, `(kiểu: ${typeof userId})`);
  console.log("  Score (number):", score, `(kiểu: ${typeof score})`);
  console.log("==============================================\n");

  try {
    console.log(`[Blockchain] Preparing to record grade for submission ${submissionId}...`);

    // 1. Băm submissionId từ string sang bytes32 để làm key
    const submissionIdHash = web3.utils.keccak256(submissionId.toString());

    // 2. Mã hóa dữ liệu (payload) cho lệnh gọi hàm 'recordGrade'
    const txData = gradeLedgerContract.methods.recordGrade(
      submissionIdHash,
      userId,
      score,
      submissionId.toString() // Gửi thêm string gốc để lưu lại
    ).encodeABI();

    // 3. Lấy giá gas hiện tại
    const gasPrice = await web3.eth.getGasPrice();

    // 4. Tạo đối tượng transaction
    const txObject = {
      from: account.address,
      to: contractAddress,
      gas: '300000', // Lượng gas cố định đủ lớn
      gasPrice: gasPrice,
      data: txData,
    };

    // 5. Ký transaction bằng private key
    const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);

    // 6. Gửi transaction đã ký lên blockchain
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log('✅ [Blockchain] Grade recorded successfully. Tx Hash:', receipt.transactionHash);
    return receipt.transactionHash;

  } catch (error) {
    console.error('❌ Error recording grade to Blockchain:', error);
    throw new Error('Không thể ghi điểm lên Blockchain.');
  }
}

module.exports = {
  recordFinalGrade,
};