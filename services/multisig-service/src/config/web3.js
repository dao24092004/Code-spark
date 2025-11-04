require('dotenv').config();
const { Web3 } = require('web3');
const solc = require('solc');
const fs = require('fs');
const path = require('path');
const config = require('./index');

let web3, account, compiledContract;

/**
 * Hàm này sẽ "dạy" solc cách tìm các file import.
 * Nó sẽ tìm trong node_modules.
 */
function findImports(importPath) {
    try {
        let filePath;
        if (importPath.startsWith('@openzeppelin/')) {
            // Tìm trong node_modules
            filePath = path.resolve(__dirname, '../../node_modules', importPath);
        } else {
            // Tìm file tương đối (nếu có)
            filePath = path.resolve(__dirname, '../contracts', importPath);
        }

        const source = fs.readFileSync(filePath, 'utf8');
        return { contents: source };
    } catch (error) {
        return { error: `File not found: ${error.message}` };
    }
}

try {
    // 1. Khởi tạo Web3 (Giữ nguyên)
    web3 = new Web3(config.blockchain.rpcUrl);
    if (!web3) throw new Error('Không thể kết nối đến RPC_URL.');

    // 2. Tải Service Account (Giữ nguyên)
    const serviceKey = config.blockchain.serviceAccountKey;
    if (!serviceKey) throw new Error('SERVICE_ACCOUNT_PRIVATE_KEY không tìm thấy');
    account = web3.eth.accounts.privateKeyToAccount('0x' + serviceKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    console.log(`✅ Web3 đã khởi tạo.`);
    console.log(`✅ Service Account: ${account.address}`);

    // 3. Đọc và Biên dịch Hợp đồng (Phần này được cập nhật)
    const contractPath = path.resolve(__dirname, '../contracts', 'MultiSigWallet.sol');
    const sourceCode = fs.readFileSync(contractPath, 'utf8');
    
    const input = {
        language: 'Solidity',
        sources: {
            'MultiSigWallet.sol': {
                content: sourceCode
            }
        },
        settings: {
            optimizer: {
                enabled: false,
                runs: 200
            },
            evmVersion: "istanbul",
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };
    
    // SỬA ĐỔI QUAN TRỌNG: Thêm { import: findImports }
    const compiledCode = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    
    if (compiledCode.errors) {
        let hasError = false;
        console.error('--- LỖI BIÊN DỊCH SOLC ---');
        compiledCode.errors.forEach(err => {
            // Lỗi biên dịch thực sự có 'severity' là 'error'
            if (err.severity && err.severity.toLowerCase() === 'error') {
                console.error(err.formattedMessage);
                hasError = true;
            } else {
                // In ra cảnh báo (warnings)
                console.warn(err.formattedMessage);
            }
        });

        if (hasError) {
            throw new Error('Lỗi biên dịch Solidity. (Chi tiết ở trên)');
        }
        console.log('✅ Biên dịch Solidity hoàn tất, không có lỗi nghiêm trọng.');
    }

    const contractFile = compiledCode.contracts['MultiSigWallet.sol']['MultiSigWallet'];
    
    compiledContract = {
        abi: contractFile.abi,
        bytecode: contractFile.evm.bytecode.object
    };
    
    console.log('✅ Hợp đồng MultiSigWallet đã được biên dịch.');

} catch (error) {
    console.error('❌ LỖI KHỞI TẠO WEB3/SOLC:');
    console.error(error.message);
    process.exit(1);
}

module.exports = { web3, account, compiledContract };

