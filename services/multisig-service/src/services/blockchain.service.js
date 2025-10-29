const { web3, account, compiledContract } = require('../config/web3');

// Hàm trợ giúp gửi giao dịch
const sendTransaction = async (method, gasLimit) => {
    // Ước tính gas
    const gas = gasLimit || await method.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    // Luôn lấy nonce 'pending' để xử lý các giao dịch liên tiếp
    const nonce = await web3.eth.getTransactionCount(account.address, 'pending');

    console.log(`Gửi tx từ ${account.address} (Nonce: ${nonce}, Gas: ${gas})`);
    
    const receipt = await method.send({
        from: account.address,
        gas,
        gasPrice,
        nonce
    });
    return receipt;
};

// Deploy một ví mới
const deployMultisigContract = async (owners, threshold) => {
    const { abi, bytecode } = compiledContract;
    const contract = new web3.eth.Contract(abi);
    
    const deployTx = contract.deploy({
        data: '0x' + bytecode,
        arguments: [owners, threshold]
    });

    const gas = await deployTx.estimateGas({ from: account.address });
    
    console.log('Đang deploy hợp đồng...');
    // Thêm gas dự phòng
    const receipt = await sendTransaction(deployTx, gas + BigInt(100000)); 
    
    console.log(`✅ Hợp đồng đã deploy tại: ${receipt.options.address}`);
    return receipt.options.address;
};

// Lấy thông tin từ 1 ví đã có
const getOnChainWalletDetails = async (contractAddress) => {
    const { abi } = compiledContract;
    const contract = new web3.eth.Contract(abi, contractAddress);
    
    const [owners, threshold, balance] = await Promise.all([
        contract.methods.getOwners().call(),
        contract.methods.requiredConfirmations().call(),
        web3.eth.getBalance(contractAddress)
    ]);
    
    return {
        owners,
        threshold: Number(threshold),
        balance: web3.utils.fromWei(balance, 'ether')
    };
};

// Gửi 1 đề xuất giao dịch
const submitTransaction = async (contractAddress, to, valueInWei, data) => {
    const { abi } = compiledContract;
    const contract = new web3.eth.Contract(abi, contractAddress);
    const method = contract.methods.submitTransaction(to, valueInWei, data);
    
    const receipt = await sendTransaction(method);
    
    // Lấy txIndex từ event
    const txIndex = receipt.events.TransactionSubmitted.returnValues.txIndex;
    return {
        txHash: receipt.transactionHash,
        txIndexOnChain: Number(txIndex)
    };
};

// Xác nhận 1 giao dịch
const confirmTransaction = async (contractAddress, txIndexOnChain) => {
    const { abi } = compiledContract;
    const contract = new web3.eth.Contract(abi, contractAddress);
    const method = contract.methods.confirmTransaction(txIndexOnChain);
    
    const receipt = await sendTransaction(method);
    return receipt.transactionHash;
};

// Thực thi 1 giao dịch
const executeTransaction = async (contractAddress, txIndexOnChain) => {
    const { abi } = compiledContract;
    const contract = new web3.eth.Contract(abi, contractAddress);
    const method = contract.methods.executeTransaction(txIndexOnChain);
    
    const receipt = await sendTransaction(method);
    return receipt.transactionHash;
};

module.exports = {
    deployMultisigContract,
    getOnChainWalletDetails,
    submitTransaction,
    confirmTransaction,
    executeTransaction
};