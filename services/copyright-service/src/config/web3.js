const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Load environment variables from the root .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL || 'http://127.0.0.1:7545';
const web3 = new Web3(new Web3.providers.HttpProvider(WEB3_PROVIDER_URL));

console.log(`Connecting to Ethereum node at ${WEB3_PROVIDER_URL}`);

const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "string", "name": "hash", "type": "string" },
            { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "name": "DocumentRegistered",
        "type": "event"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_hash", "type": "string" }],
        "name": "registerDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_hash", "type": "string" }],
        "name": "getDocumentInfo",
        "outputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Function to read contract address from file or use environment variable
function getContractAddress() {
    const contractAddressFile = path.join(__dirname, '../../contract-address.txt');

    // Try to read from file first (for containerized deployment)
    if (fs.existsSync(contractAddressFile)) {
        try {
            const address = fs.readFileSync(contractAddressFile, 'utf8').trim();
            if (address && address.startsWith('0x')) {
                console.log(`Using contract address from file: ${address}`);
                return address;
            }
        } catch (error) {
            console.warn(`Could not read contract address from file: ${error.message}`);
        }
    }

    // Fallback to environment variable (for local development)
    const envAddress = process.env.CONTRACT_ADDRESS;
    if (envAddress) {
        console.log(`Using contract address from environment: ${envAddress}`);
        return envAddress;
    }

    // Default address (for development)
    const defaultAddress = '0x41dD77E49090224d3FcC0362a1Cde8F860Eed3d8';
    console.log(`Using default contract address: ${defaultAddress}`);
    return defaultAddress;
}

const CONTRACT_ADDRESS = getContractAddress();
const copyrightContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

const ACCOUNT_PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY;
if (!ACCOUNT_PRIVATE_KEY) {
    console.error('FATAL ERROR: ACCOUNT_PRIVATE_KEY environment variable is not set.');
    process.exit(1);
}

const account = web3.eth.accounts.privateKeyToAccount(ACCOUNT_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
console.log(`Using account ${account.address} to send transactions.`);

module.exports = { web3, copyrightContract, account };