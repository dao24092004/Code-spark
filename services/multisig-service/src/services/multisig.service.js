const { web3, multiSigContract, account } = require('../config/web3');

const getWalletInfo = async () => {
    if (!multiSigContract) throw new Error("MultiSig contract not initialized.");
    const owners = await multiSigContract.methods.getOwners().call();
    const requiredConfirmations = await multiSigContract.methods.requiredConfirmations().call();
    const balance = await web3.eth.getBalance(multiSigContract.options.address);
    return {
        address: multiSigContract.options.address,
        owners,
        requiredConfirmations: requiredConfirmations.toString(),
        balance: web3.utils.fromWei(balance, 'ether')
    };
};

const getTransactions = async () => {
    if (!multiSigContract) throw new Error("MultiSig contract not initialized.");
    const txCount = await multiSigContract.methods.getTransactionCount().call();
    const transactions = [];
    for (let i = 0; i < txCount; i++) {
        const tx = await multiSigContract.methods.getTransaction(i).call();
        transactions.push({
            txIndex: i,
            to: tx.to,
            value: web3.utils.fromWei(tx.value, 'ether'),
            data: tx.data,
            executed: tx.executed,
            numConfirmations: tx.numConfirmations.toString()
        });
    }
    return transactions;
};

const submitTransaction = async (to, value, data) => {
    if (!multiSigContract) throw new Error("MultiSig contract not initialized.");
    const valueWei = web3.utils.toWei(value, 'ether');
    const tx = await multiSigContract.methods.submitTransaction(to, valueWei, data).send({
        from: account.address,
        gas: await multiSigContract.methods.submitTransaction(to, valueWei, data).estimateGas({ from: account.address })
    });
    return tx.transactionHash;
};

const confirmTransaction = async (txIndex) => {
    if (!multiSigContract) throw new Error("MultiSig contract not initialized.");
    const tx = await multiSigContract.methods.confirmTransaction(txIndex).send({
        from: account.address,
        gas: await multiSigContract.methods.confirmTransaction(txIndex).estimateGas({ from: account.address })
    });
    return tx.transactionHash;
};

const executeTransaction = async (txIndex) => {
    if (!multiSigContract) throw new Error("MultiSig contract not initialized.");
    const tx = await multiSigContract.methods.executeTransaction(txIndex).send({
        from: account.address,
        gas: await multiSigContract.methods.executeTransaction(txIndex).estimateGas({ from: account.address })
    });
    return tx.transactionHash;
};

const revokeConfirmation = async (txIndex) => {
    if (!multiSigContract) throw new Error("MultiSig contract not initialized.");
    const tx = await multiSigContract.methods.revokeConfirmation(txIndex).send({
        from: account.address,
        gas: await multiSigContract.methods.revokeConfirmation(txIndex).estimateGas({ from: account.address })
    });
    return tx.transactionHash;
};

module.exports = {
    getWalletInfo,
    getTransactions,
    submitTransaction,
    confirmTransaction,
    executeTransaction,
    revokeConfirmation
};