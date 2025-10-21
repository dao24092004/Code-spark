const { Web3 } = require('web3');
const config = require('./index');
const fs = require('fs');
const path = require('path');

try {
  // Đọc thông tin từ file artifact đã được tạo ra lúc deploy
  const artifactPath = path.resolve(__dirname, '..', '..', 'artifacts', 'ProctoringLog.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const contractAbi = artifact.abi;
  // Lấy địa chỉ contract từ biến môi trường
  const contractAddress = config.blockchain.contractAddress;

  if (!contractAddress) {
    throw new Error('CONTRACT_ADDRESS is not defined in .env file.');
  }

  // Cập nhật cú pháp khởi tạo Web3
  const web3 = new Web3(config.blockchain.providerUrl);

  // Khởi tạo đối tượng contract
  const proctoringLogContract = new web3.eth.Contract(contractAbi, contractAddress);

  console.log('✅ Kết nối Web3 và khởi tạo contract thành công.');

  module.exports = {
    web3,
    proctoringLogContract,
  };

} catch (error) {
  console.error('❌ Lỗi khi khởi tạo Web3 hoặc contract. Hãy chắc chắn bạn đã deploy contract và cập nhật file .env.', error.message);
  // Export các đối tượng rỗng để ứng dụng không bị crash hoàn toàn
  module.exports = {
    web3: null,
    proctoringLogContract: null,
  };
}