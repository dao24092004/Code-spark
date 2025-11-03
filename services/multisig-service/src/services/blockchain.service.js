const { web3, account, compiledContract } = require('../config/web3');

// Hàm trợ giúp gửi giao dịch
// accountToUse: (optional) Account để sign transaction. Nếu không có, dùng Service Account
// contractAddress: (optional) Địa chỉ contract, cần cho việc sign transaction thủ công
const sendTransaction = async (method, gasLimit, accountToUse = null, contractAddress = null) => {
    const signerAccount = accountToUse || account;
    const fromAddress = signerAccount.address;
    
    // Ước tính gas
    const gas = gasLimit || await method.estimateGas({ from: fromAddress });
    const gasPrice = await web3.eth.getGasPrice();
    // Luôn lấy nonce 'pending' để xử lý các giao dịch liên tiếp
    const nonce = await web3.eth.getTransactionCount(fromAddress, 'pending');

    console.log(`Gửi tx từ ${fromAddress} (Nonce: ${nonce}, Gas: ${gas})`);
    
    // Nếu accountToUse được truyền vào và có private key, cần sign transaction thủ công
    // (Vì Ganache có thể không nhận diện account này nếu nó không được unlock)
    if (accountToUse && accountToUse.privateKey) {
        // Build transaction data
        const txData = method.encodeABI();
        
        // Lấy contract address
        // Thử nhiều cách để lấy contract address
        let toAddress = contractAddress;
        if (!toAddress) {
            // Thử từ method object
            if (method._parent) {
                toAddress = method._parent._address || method._parent.options?.address;
            }
            // Thử từ contract instance
            if (!toAddress && method._parent?.options) {
                toAddress = method._parent.options.address;
            }
        }
        
        if (!toAddress) {
            throw new Error('Không thể xác định contract address để gửi transaction. Vui lòng truyền contractAddress vào sendTransaction.');
        }
        
        // Tạo raw transaction object
        const rawTx = {
            from: fromAddress,
            to: toAddress,
            data: txData,
            gas: gas.toString(),
            gasPrice: gasPrice.toString(),
            nonce: nonce.toString(),
            chainId: await web3.eth.getChainId() || 1337 // Ganache default network ID
        };
        
        console.log(`Signing transaction manually for ${fromAddress}...`);
        
        // Sign transaction với private key
        const signedTx = await web3.eth.accounts.signTransaction(rawTx, accountToUse.privateKey);
        
        // Gửi signed transaction
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
    } else {
        // Dùng method.send() như bình thường (Service Account hoặc account đã được unlock trong Ganache)
        const receipt = await method.send({
            from: fromAddress,
            gas,
            gasPrice,
            nonce
        });
        return receipt;
    }
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
    try {
        // Kiểm tra contract có code không
        const code = await web3.eth.getCode(contractAddress);
        if (!code || code === '0x' || code === '0x0') {
            throw new Error(`Contract không tồn tại tại địa chỉ ${contractAddress}. Có thể contract chưa được deploy hoặc địa chỉ không đúng.`);
        }
        
        const { abi } = compiledContract;
        const contract = new web3.eth.Contract(abi, contractAddress);
        
        // Thử lấy owners trước để kiểm tra contract có đúng không
        let owners, threshold, balance;
        
        try {
            [owners, threshold, balance] = await Promise.all([
                contract.methods.getOwners().call(),
                contract.methods.requiredConfirmations().call(),
                web3.eth.getBalance(contractAddress)
            ]);
        } catch (callError) {
            throw new Error(`Không thể gọi contract methods tại địa chỉ ${contractAddress}. Có thể ABI không đúng hoặc contract không phải là MultiSigWallet. Chi tiết: ${callError.message}`);
        }
        
        return {
            owners,
            threshold: Number(threshold),
            balance: web3.utils.fromWei(balance, 'ether')
        };
    } catch (error) {
        // Log chi tiết lỗi để debug
        console.error(`Error getting on-chain wallet details for ${contractAddress}:`, error);
        throw error;
    }
};

// Gửi 1 đề xuất giao dịch
// accountToUse: (optional) Account để sign transaction. Nếu không có, dùng Service Account
const submitTransaction = async (contractAddress, to, valueInWei, data, accountToUse = null) => {
    const signerAccount = accountToUse || account;
    const { abi } = compiledContract;
    const contract = new web3.eth.Contract(abi, contractAddress);
    const method = contract.methods.submitTransaction(to, valueInWei, data);
    
    // Truyền contractAddress vào sendTransaction để sign transaction đúng
    const receipt = await sendTransaction(method, null, signerAccount, contractAddress);
    
    // Kiểm tra transaction status
    if (!receipt.status) {
        throw new Error('Transaction failed or reverted');
    }
    
    // Lấy txIndex từ event
    // Nếu dùng sendSignedTransaction, events sẽ ở trong logs và cần parse
    let txIndex;
    
    // Thử lấy từ receipt.events (method.send())
    if (receipt.events && receipt.events.TransactionSubmitted) {
        txIndex = receipt.events.TransactionSubmitted.returnValues.txIndex;
    } 
    // Thử parse từ logs (sendSignedTransaction)
    else if (receipt.logs && receipt.logs.length > 0) {
        try {
            // Tìm log có event TransactionSubmitted
            for (const log of receipt.logs) {
                try {
                    const decoded = contract.decodeEventLog('TransactionSubmitted', log.data, log.topics);
                    if (decoded && decoded.txIndex !== undefined) {
                        txIndex = decoded.txIndex;
                        break;
                    }
                } catch (err) {
                    // Không phải event TransactionSubmitted, tiếp tục tìm
                    continue;
                }
            }
        } catch (err) {
            console.warn('Error parsing event logs:', err.message);
        }
    }
    
    // Fallback: lấy từ transaction count nếu không parse được event
    if (txIndex === undefined) {
        console.warn('Could not get txIndex from event, using transaction count fallback');
        try {
            const txCount = await contract.methods.getTransactionCount().call();
            txIndex = Number(txCount) - 1;
        } catch (err) {
            throw new Error(`Cannot get txIndex from event or transaction count: ${err.message}`);
        }
    }
    
    return {
        txHash: receipt.transactionHash,
        txIndexOnChain: Number(txIndex)
    };
};

// Xác nhận 1 giao dịch
// accountToUse: (optional) Account để sign transaction. Nếu không có, dùng Service Account
const confirmTransaction = async (contractAddress, txIndexOnChain, accountToUse = null) => {
    const signerAccount = accountToUse || account;
    const { abi } = compiledContract;
    const contract = new web3.eth.Contract(abi, contractAddress);
    const method = contract.methods.confirmTransaction(txIndexOnChain);
    
    // Truyền contractAddress vào sendTransaction để sign transaction đúng
    const receipt = await sendTransaction(method, null, signerAccount, contractAddress);
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

