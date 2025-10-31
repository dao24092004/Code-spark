// file: scripts/deploy-contracts.js

const fs = require('fs');
const path = require('path');
const web3 = require('../src/config/web3'); // Import web3 đã cấu hình
require('dotenv').config(); // Đọc file .env

const deploy = async () => {
  try {
    // 1. Lấy thông tin tài khoản sẽ trả gas từ private key trong file .env
    const privateKey = process.env.OWNER_ACCOUNT_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("OWNER_ACCOUNT_PRIVATE_KEY is not defined in .env file.");
    }
    const deployerAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log('Sử dụng tài khoản deploy:', deployerAccount.address);

    // 2. Đọc file ABI và Bytecode đã biên dịch
    const abiPath = path.resolve(__dirname, '../src/contracts/build/src_contracts_GradeLedger_sol_GradeLedger.abi');
    const bytecodePath = path.resolve(__dirname, '../src/contracts/build/src_contracts_GradeLedger_sol_GradeLedger.bin');
    
    if (!fs.existsSync(abiPath) || !fs.existsSync(bytecodePath)) {
        throw new Error("ABI or BIN file not found. Please compile the contract first by running 'solcjs ...'");
    }

    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const bytecode = fs.readFileSync(bytecodePath, 'utf8');

    // 3. Deploy contract
    console.log('Đang deploy contract...');
    const gradeLedgerContract = new web3.eth.Contract(abi);
    
    const deployedContract = await gradeLedgerContract.deploy({
      data: '0x' + bytecode,
    }).send({
      from: deployerAccount.address,
      gas: '1500000',
    });

    // 4. In ra địa chỉ contract đã deploy
    console.log('\n================================================================');
    console.log('✅ Contract đã deploy thành công tại địa chỉ:');
    console.log(deployedContract.options.address);
    console.log('================================================================');
    console.log('\n>>> Hãy copy địa chỉ trên và dán vào biến GRADE_LEDGER_CONTRACT_ADDRESS trong file .env của bạn.');

  } catch (error) {
    console.error('❌ Lỗi khi deploy contract:', error.message);
  }
};

deploy();