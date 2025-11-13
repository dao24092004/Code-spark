const { web3, copyrightContract, account } = require('../config/web3');

const checkBlockchainConnection = async () => {
    try {
        await web3.eth.net.isListening();
        return true;
    } catch (error) {
        console.warn('Blockchain connection check failed:', error.message);
        return false;
    }
};

const getDocumentInfoFromChain = async (hash) => {
    try {
        console.log(`Querying blockchain for hash: ${hash}`);
        const result = await copyrightContract.methods.getDocumentInfo(hash).call();
        console.log(`Blockchain query result: ${JSON.stringify(result)}`);

        if (result && result.owner && result.owner !== '0x0000000000000000000000000000000000000000') {
            return { owner: result.owner, timestamp: result.timestamp };
        }
        
        return null;
    } catch (error) {
        let revertReason = '';
        // Extract the specific revert reason from the nested error object
        if (error.cause && error.cause.cause && typeof error.cause.cause === 'string') {
            revertReason = error.cause.cause;
        } else if (error.cause && error.cause.message) { // Fallback for other error structures
            revertReason = error.cause.message;
        }

        if (revertReason.includes("Document hash not found")) {
            console.log(`Hash ${hash} not found on the blockchain (handled).`);
            return null; // Treat as "not found"
        }

        // Also check for the old error message just in case
        if (error.message.includes("Returned values aren't valid")) {
            console.log(`Hash ${hash} not found on the blockchain (decoding error).`);
            return null; // Treat as "not found"
        }

        console.error('Detailed error fetching document info from blockchain:', error);
        throw new Error(`Failed to query blockchain. Reason: ${error.message}`);
    }
};

const registerDocumentOnChain = async (hash) => {
    try {
        // Check if blockchain is available
        const isConnected = await checkBlockchainConnection();
        if (!isConnected) {
            console.warn('Blockchain not available, skipping registration on chain');
            return null; // Return null to indicate blockchain registration was skipped
        }

        console.log(`Attempting to register hash ${hash} on the blockchain...`);
        
        // Force legacy transaction type for older Ganache versions by setting gasPrice
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await copyrightContract.methods.registerDocument(hash).estimateGas({ from: account.address });

        const tx = await copyrightContract.methods.registerDocument(hash).send({
            from: account.address,
            gas: gasEstimate,
            gasPrice: gasPrice
        });
        console.log(`Successfully registered hash on blockchain. Transaction hash: ${tx.transactionHash}`);
        return tx.transactionHash;
    } catch (error) {
        console.error('Error registering document on blockchain:', error.message || error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw new Error(`Blockchain transaction failed: ${error.message || 'Unknown error'}`);
    }
};

module.exports = {
    checkBlockchainConnection,
    getDocumentInfoFromChain,
    registerDocumentOnChain,
};