const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { Web3 } = require('web3');
const config = require('../src/config');

async function deploy() {
  console.log('Bắt đầu quá trình deploy...');

  const web3 = new Web3(config.blockchain.providerUrl);

  if (!config.blockchain.privateKey) {
    console.error('Lỗi: Vui lòng cung cấp ACCOUNT_PRIVATE_KEY trong file .env');
    return;
  }
  const privateKey = config.blockchain.privateKey.startsWith('0x')
    ? config.blockchain.privateKey
    : '0x' + config.blockchain.privateKey;
    
  const deployerAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(deployerAccount);
  console.log(`Sử dụng tài khoản deploy: ${deployerAccount.address}`);

  const contractPath = path.resolve(__dirname, '..', 'contracts', 'ProctoringLog.sol');
  const sourceCode = fs.readFileSync(contractPath, 'utf8');
  
  const input = {
    language: 'Solidity',
    sources: {
      'ProctoringLog.sol': {
        content: sourceCode,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  console.log('Đang biên dịch contract...');
  const compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (compiledContract.errors) {
    console.error('Lỗi biên dịch:');
    compiledContract.errors.forEach(err => console.error(err.formattedMessage));
    return;
  }

  const contractInterface = compiledContract.contracts['ProctoringLog.sol']['ProctoringLog'];
  const contractBytecode = contractInterface.evm.bytecode.object;
  const contractAbi = contractInterface.abi;

  const proctoringLogContract = new web3.eth.Contract(contractAbi);
  console.log('Đang deploy contract lên blockchain...');
  
  const gasEstimate = await proctoringLogContract.deploy({ data: '0x' + contractBytecode }).estimateGas({ from: deployerAccount.address });

  const deployedContract = await proctoringLogContract
    .deploy({ data: '0x' + contractBytecode })
    .send({ from: deployerAccount.address, gas: gasEstimate * 2n });

  const contractAddress = deployedContract.options.address;
  console.log('✅ Deploy thành công!');
  console.log(`📜 Địa chỉ contract: ${contractAddress}`);

  const artifact = { abi: contractAbi, address: contractAddress };
  const artifactPath = path.resolve(__dirname, '..', 'artifacts', 'ProctoringLog.json');
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  
  console.log(`📄 Artifact đã được lưu tại: ${artifactPath}`);
  console.log('\n👉 Vui lòng copy địa chỉ contract và dán vào CONTRACT_ADDRESS trong file .env!');
}

deploy().catch(console.error);