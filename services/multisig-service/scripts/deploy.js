require('dotenv').config({ path: '../.env' }); // Tải biến môi trường từ thư mục gốc
const { Web3 } = require('web3');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

const deploy = async () => {
    console.log('🚀 Bắt đầu quá trình triển khai hợp đồng...');

    // 1. Kết nối đến node blockchain
    const web3 = new Web3(process.env.RPC_URL);
    const deployerAccount = web3.eth.accounts.privateKeyToAccount('0x' + process.env.DEPLOYER_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(deployerAccount);
    console.log(`Deployer address: ${deployerAccount.address}`);

    // 2. Đọc và biên dịch hợp đồng
    const contractPath = path.resolve(__dirname, '../src/contracts', 'MultiSigWallet.sol');
    const sourceCode = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: { 'MultiSigWallet.sol': { content: sourceCode } },
        settings: { outputSelection: { '*': { '*': ['*'] } } }
    };

    const compiledCode = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractFile = compiledCode.contracts['MultiSigWallet.sol']['MultiSigWallet'];
    const abi = contractFile.abi;
    const bytecode = contractFile.evm.bytecode.object;
    console.log('✅ Hợp đồng đã được biên dịch.');

    // 3. Chuẩn bị tham số cho constructor
    const owners = JSON.parse(process.env.MULTISIG_OWNERS);
    const requiredConfirmations = parseInt(process.env.MULTISIG_REQUIRED, 10);
    console.log('Chủ sở hữu:', owners);
    console.log('Số xác nhận yêu cầu:', requiredConfirmations);

    // 4. Triển khai hợp đồng
    const multiSigContract = new web3.eth.Contract(abi);
    const deployTx = multiSigContract.deploy({
        data: '0x' + bytecode,
        arguments: [owners, requiredConfirmations]
    });

    const gas = await deployTx.estimateGas();
    const gasPrice = await web3.eth.getGasPrice();

    console.log('Đang triển khai...');
    const receipt = await deployTx.send({
        from: deployerAccount.address,
        gas,
        gasPrice
    });

    const contractAddress = receipt.options.address;
    console.log(`✅ Hợp đồng đã được triển khai tại địa chỉ: ${contractAddress}`);

    // 5. Lưu thông tin hợp đồng
    const contractInfo = {
        address: contractAddress,
        abi: abi
    };
    const infoPath = path.resolve(__dirname, '../src/config', 'contract-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(contractInfo, null, 2));
    console.log(`✅ Thông tin hợp đồng đã được lưu tại: ${infoPath}`);
};

deploy().catch(console.error);