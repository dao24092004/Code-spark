const { web3, proctoringLogContract } = require('../config/web3');
const config = require('../config');

async function recordViolation(violationData) {
  if (!proctoringLogContract || !web3) {
    console.error('Blockchain service không khả dụng do contract hoặc web3 chưa được khởi tạo.');
    throw new Error('Contract or Web3 not initialized.');
  }

  // 1. NÂNG CẤP: Lấy tài khoản từ Private Key
  if (!config.blockchain.privateKey) {
    throw new Error('ACCOUNT_PRIVATE_KEY not found in .env');
  }
  const privateKey = config.blockchain.privateKey.startsWith('0x')
    ? config.blockchain.privateKey
    : '0x' + config.blockchain.privateKey;
  const ownerAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

  const { sessionId, studentId, violationType, transactionHash } = violationData;

  try {
    console.log('[Blockchain] Đang chuẩn bị ghi vi phạm...');
    
    // 2. NÂNG CẤP: Tạo transaction, ký, và gửi đi
    const tx = proctoringLogContract.methods.recordViolation(sessionId, studentId, violationType, transactionHash);
    const gas = await tx.estimateGas({ from: ownerAccount.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();
    const nonce = await web3.eth.getTransactionCount(ownerAccount.address);

    const signedTx = await web3.eth.accounts.signTransaction({
      to: proctoringLogContract.options.address, // Địa chỉ của contract
      data,
      gas,
      gasPrice,
      nonce,
      chainId: await web3.eth.getChainId() // Lấy chainId để bảo mật
    }, privateKey);

    console.log("[Blockchain] Đang gửi transaction đã ký...");
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log('✅ [Blockchain] Vi phạm đã được ghi thành công!');
    console.log('Transaction Hash:', receipt.transactionHash);

    return receipt.transactionHash;

  } catch (error) {
    console.error('❌ [Blockchain] Lỗi khi ghi vi phạm:', error.message);
    throw error;
  }
}

module.exports = {
  recordViolation,
};