const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const config = require('./index');

let web3, multiSigContract, account;

try {
    // 1. Tải thông tin hợp đồng từ tệp JSON
    const infoPath = path.resolve(__dirname, 'contract-info.json');
    if (!fs.existsSync(infoPath)) {
        throw new Error('Tệp contract-info.json không tồn tại. Hãy chạy script triển khai trước.');
    }
    const contractInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    const contractAddress = contractInfo.address;
    const contractAbi = contractInfo.abi;

    // 2. Khởi tạo Web3
    web3 = new Web3(config.blockchain.rpcUrl);

    // 3. Thêm tài khoản deployer (để gửi giao dịch)
    account = web3.eth.accounts.privateKeyToAccount('0x' + config.blockchain.deployerKey);
    web3.eth.accounts.wallet.add(account);

    // 4. Khởi tạo đối tượng hợp đồng
    multiSigContract = new web3.eth.Contract(contractAbi, contractAddress);

    console.log(`✅ Web3 và hợp đồng MultiSig tại ${contractAddress} đã được khởi tạo.`);

} catch (error) {
    console.error('❌ Lỗi khởi tạo Web3:', error.message);
    // Nếu không có web3, các biến sẽ là undefined, cần xử lý ở nơi sử dụng
}

module.exports = { web3, multiSigContract, account };