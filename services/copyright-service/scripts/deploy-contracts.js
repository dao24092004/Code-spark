#!/usr/bin/env node

const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Configuration
const GANACHE_URL = process.env.GANACHE_URL || 'http://localhost:7545';
const CONTRACT_ADDRESS_FILE = process.env.CONTRACT_ADDRESS_FILE || './contract-address.txt';

async function deployContracts() {
    try {
        console.log('🚀 Starting contract deployment...');
        console.log(`📡 Connecting to Ganache at ${GANACHE_URL}`);

        // Initialize Web3
        const web3 = new Web3(GANACHE_URL);

        // Get accounts
        const accounts = await web3.eth.getAccounts();
        const deployerAccount = accounts[0];

        console.log(`👤 Using deployer account: ${deployerAccount}`);

        // Read contract artifact
        const contractArtifactPath = path.join(__dirname, '../artifacts/Copyright.json');

        if (!fs.existsSync(contractArtifactPath)) {
            console.error(`❌ Contract artifact not found at ${contractArtifactPath}`);
            console.log('💡 Please compile your contracts first using: npm run compile');
            process.exit(1);
        }

        const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath, 'utf8'));
        const Contract = new web3.eth.Contract(contractArtifact.abi);

        console.log('📄 Deploying Copyright contract...');

        // Deploy contract
        const deployTx = Contract.deploy({
            data: contractArtifact.data.bytecode.object,
            arguments: [] // Constructor arguments (none for this contract)
        });

        const gasEstimate = await deployTx.estimateGas({ from: deployerAccount });
        console.log(`⛽ Estimated gas: ${gasEstimate}`);

        const deployedContract = await deployTx.send({
            from: deployerAccount,
            gas: gasEstimate,
            gasPrice: await web3.eth.getGasPrice()
        });

        const contractAddress = deployedContract.options.address;
        console.log(`✅ Contract deployed successfully!`);
        console.log(`📍 Contract address: ${contractAddress}`);

        // Save contract address to file
        fs.writeFileSync(CONTRACT_ADDRESS_FILE, contractAddress);
        console.log(`💾 Contract address saved to ${CONTRACT_ADDRESS_FILE}`);

        // Verify deployment
        console.log('🔍 Verifying deployment...');
        const deployedCode = await web3.eth.getCode(contractAddress);
        if (deployedCode === '0x') {
            throw new Error('Contract deployment verification failed');
        }
        console.log('✅ Deployment verified successfully');

        console.log('🎉 Contract deployment completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Contract deployment failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run deployment
deployContracts();
