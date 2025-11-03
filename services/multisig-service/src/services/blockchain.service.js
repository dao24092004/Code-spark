const { web3, getContractInstance, checkBlockchainConnection } = require('../config/web3');
const config = require('../config');

/**
 * Deploy một MultisigWallet contract mới
 * @param {Array} owners - Danh sách địa chỉ owners
 * @param {Number} threshold - Số lượng chữ ký tối thiểu cần thiết
 * @param {Object} options - Options cho deployment (from, privateKey)
 * @returns {Promise<string>} Contract address
 */
async function deployMultisigContract(owners, threshold, options = {}) {
  try {
    const isConnected = await checkBlockchainConnection();
    if (!isConnected) {
      throw new Error('Blockchain connection failed');
    }

    // Load contract từ Truffle artifacts hoặc compile on-the-fly
    const path = require('path');
    const fs = require('fs');
    const artifactPath = path.join(__dirname, '../../build/contracts/MultiSigWallet.json');
    
    let artifact;
    if (fs.existsSync(artifactPath)) {
      artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    } else {
      // Fallback: Sử dụng solc để compile on-the-fly
      console.warn('⚠️  Contract artifact not found. Compiling on-the-fly...');
      try {
        const solc = require('solc');
        const contractPath = path.join(__dirname, '../../contracts/MultiSigWallet.sol');
        const sourceCode = fs.readFileSync(contractPath, 'utf8');
        
        const input = {
          language: 'Solidity',
          sources: {
            'MultiSigWallet.sol': {
              content: sourceCode
            }
          },
          settings: {
            outputSelection: {
              '*': {
                '*': ['abi', 'evm.bytecode']
              }
            }
          }
        };
        
        const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
        if (compiled.errors && compiled.errors.length > 0) {
          const errors = compiled.errors.filter(e => e.severity === 'error');
          if (errors.length > 0) {
            throw new Error('Compilation errors: ' + errors.map(e => e.message).join('; '));
          }
        }
        
        const contractFile = compiled.contracts['MultiSigWallet.sol']['MultiSigWallet'];
        artifact = {
          abi: contractFile.abi,
          bytecode: contractFile.evm.bytecode.object,
          evm: { bytecode: { object: contractFile.evm.bytecode.object } }
        };
        console.log('✅ Contract compiled successfully');
      } catch (compileError) {
        throw new Error(`Contract compilation failed: ${compileError.message}. Please run: truffle compile`);
      }
    }

    const contract = new web3.eth.Contract(artifact.abi);

    // Validate inputs
    if (!owners || owners.length === 0) {
      throw new Error('Owners array cannot be empty');
    }
    if (!threshold || threshold < 1 || threshold > owners.length) {
      throw new Error(`Threshold must be between 1 and ${owners.length}`);
    }

    // Get bytecode from artifact
    const bytecode = artifact.bytecode || artifact.evm?.bytecode?.object || artifact.data?.bytecode?.object;
    if (!bytecode) {
      throw new Error('Contract bytecode not found. Please ensure contract is compiled.');
    }

    // Deploy contract
    const deployTx = contract.deploy({
      data: bytecode,
      arguments: [owners, threshold]
    });

    const from = options.from || (await web3.eth.getAccounts())[0];
    const gasEstimate = await deployTx.estimateGas({ from });

    let receipt;
    if (options.privateKey) {
      // Sign and send transaction với private key
      const tx = {
        data: deployTx.encodeABI(),
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice(),
        nonce: await web3.eth.getTransactionCount(from, 'pending')
      };

      const signed = await web3.eth.accounts.signTransaction(tx, options.privateKey);
      receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    } else {
      // Use default account (Metamask hoặc account đã unlock)
      receipt = await deployTx.send({
        from,
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice()
      });
    }

    const contractAddress = receipt.contractAddress;
    console.log(`✅ MultisigWallet deployed at: ${contractAddress}`);
    
    return contractAddress;
  } catch (error) {
    console.error('❌ Error deploying contract:', error);
    throw new Error(`Contract deployment failed: ${error.message}`);
  }
}

/**
 * Lấy thông tin ví từ blockchain
 * @param {string} contractAddress - Địa chỉ contract
 * @returns {Promise<Object>} Wallet details
 */
async function getOnChainWalletDetails(contractAddress) {
  try {
    const contract = getContractInstance(contractAddress);
    if (!contract) {
      throw new Error('Contract instance not found');
    }

    const [owners, threshold, balance] = await Promise.all([
      contract.methods.getOwners().call(),
      contract.methods.requiredConfirmations().call(),
      web3.eth.getBalance(contractAddress)
    ]);

    return {
      owners: Array.isArray(owners) ? owners : [],
      threshold: Number(threshold),
      balance: web3.utils.fromWei(balance, 'ether')
    };
  } catch (error) {
    console.error('❌ Error getting wallet details:', error);
    throw new Error(`Failed to get wallet details: ${error.message}`);
  }
}

/**
 * Submit một transaction mới
 * @param {string} contractAddress - Địa chỉ contract
 * @param {string} to - Địa chỉ đích
 * @param {string} valueInWei - Giá trị (wei)
 * @param {string} data - Data (hex string)
 * @param {Object} options - Options (from, privateKey)
 * @returns {Promise<Object>} Transaction receipt với txIndex
 */
async function submitTransaction(contractAddress, to, valueInWei, data, options = {}) {
  try {
    const contract = getContractInstance(contractAddress);
    if (!contract) {
      throw new Error('Contract instance not found');
    }

    const from = options.from;
    if (!from) {
      throw new Error('From address is required');
    }

    const method = contract.methods.submitTransaction(to, valueInWei, data || '0x');

    let receipt;
    if (options.privateKey) {
      // Sign với private key
      const gasEstimate = await method.estimateGas({ from });
      const tx = {
        to: contractAddress,
        data: method.encodeABI(),
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice(),
        nonce: await web3.eth.getTransactionCount(from, 'pending')
      };

      const prefixedKey = options.privateKey.startsWith('0x') 
        ? options.privateKey 
        : `0x${options.privateKey}`;
      
      const signed = await web3.eth.accounts.signTransaction(tx, prefixedKey);
      receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    } else {
      // Use default account hoặc Metamask
      receipt = await method.send({ from });
    }

    // Lấy txIndex từ event hoặc từ transaction count
    let txIndex = null;
    if (receipt.events && receipt.events.TransactionSubmitted) {
      txIndex = Number(receipt.events.TransactionSubmitted.returnValues.txIndex);
    } else {
      // Fallback: lấy từ transaction count
      const txCount = await contract.methods.getTransactionCount().call();
      txIndex = Number(txCount) - 1;
    }

    return {
      txHash: receipt.transactionHash,
      txIndexOnChain: txIndex
    };
  } catch (error) {
    console.error('❌ Error submitting transaction:', error);
    throw new Error(`Transaction submission failed: ${error.message}`);
  }
}

/**
 * Confirm một transaction
 * @param {string} contractAddress - Địa chỉ contract
 * @param {number} txIndexOnChain - Index của transaction trên chain
 * @param {Object} options - Options (from, privateKey)
 * @returns {Promise<string>} Transaction hash
 */
async function confirmTransaction(contractAddress, txIndexOnChain, options = {}) {
  try {
    const contract = getContractInstance(contractAddress);
    if (!contract) {
      throw new Error('Contract instance not found');
    }

    const from = options.from;
    if (!from) {
      throw new Error('From address is required');
    }

    const method = contract.methods.confirmTransaction(txIndexOnChain);

    let receipt;
    if (options.privateKey) {
      const gasEstimate = await method.estimateGas({ from });
      const tx = {
        to: contractAddress,
        data: method.encodeABI(),
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice(),
        nonce: await web3.eth.getTransactionCount(from, 'pending')
      };

      const prefixedKey = options.privateKey.startsWith('0x') 
        ? options.privateKey 
        : `0x${options.privateKey}`;
      
      const signed = await web3.eth.accounts.signTransaction(tx, prefixedKey);
      receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    } else {
      receipt = await method.send({ from });
    }

    return receipt.transactionHash;
  } catch (error) {
    console.error('❌ Error confirming transaction:', error);
    throw new Error(`Transaction confirmation failed: ${error.message}`);
  }
}

/**
 * Execute một transaction
 * @param {string} contractAddress - Địa chỉ contract
 * @param {number} txIndexOnChain - Index của transaction trên chain
 * @param {Object} options - Options (from, privateKey)
 * @returns {Promise<string>} Transaction hash
 */
async function executeTransaction(contractAddress, txIndexOnChain, options = {}) {
  try {
    const contract = getContractInstance(contractAddress);
    if (!contract) {
      throw new Error('Contract instance not found');
    }

    // Kiểm tra số confirmations trước
    const tx = await contract.methods.getTransaction(txIndexOnChain).call();
    const threshold = await contract.methods.requiredConfirmations().call();
    
    if (Number(tx.numConfirmations) < Number(threshold)) {
      throw new Error(`Not enough confirmations. Required: ${threshold}, Current: ${tx.numConfirmations}`);
    }

    const from = options.from;
    if (!from) {
      throw new Error('From address is required');
    }

    const method = contract.methods.executeTransaction(txIndexOnChain);

    let receipt;
    if (options.privateKey) {
      const gasEstimate = await method.estimateGas({ from });
      const tx_obj = {
        to: contractAddress,
        data: method.encodeABI(),
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice(),
        nonce: await web3.eth.getTransactionCount(from, 'pending')
      };

      const prefixedKey = options.privateKey.startsWith('0x') 
        ? options.privateKey 
        : `0x${options.privateKey}`;
      
      const signed = await web3.eth.accounts.signTransaction(tx_obj, prefixedKey);
      receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    } else {
      receipt = await method.send({ from });
    }

    return receipt.transactionHash;
  } catch (error) {
    console.error('❌ Error executing transaction:', error);
    throw new Error(`Transaction execution failed: ${error.message}`);
  }
}

module.exports = {
  deployMultisigContract,
  getOnChainWalletDetails,
  submitTransaction,
  confirmTransaction,
  executeTransaction
};

