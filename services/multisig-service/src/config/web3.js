require('dotenv').config();
const { Web3 } = require('web3');
const path = require('path');
const fs = require('fs');
const config = require('./index');

// Initialize Web3
const web3 = new Web3(config.blockchain.providerUrl);

console.log(`✅ Web3 initialized with provider: ${config.blockchain.providerUrl}`);

// Load contract ABI từ Truffle build artifacts
function loadContractArtifact() {
  try {
    const artifactPath = path.join(__dirname, '../../build/contracts/MultiSigWallet.json');
    
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      return {
        abi: artifact.abi,
        networks: artifact.networks
      };
    } else {
      console.warn('⚠️  Contract artifact not found. Please run: npm run compile');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading contract artifact:', error.message);
    return null;
  }
}

// Get contract address từ Truffle networks hoặc env
function getContractAddress(networkId = null) {
  const artifact = loadContractArtifact();
  const targetNetworkId = networkId || config.blockchain.networkId.toString();
  
  if (artifact && artifact.networks && artifact.networks[targetNetworkId]) {
    const address = artifact.networks[targetNetworkId].address;
    console.log(`✅ Using contract address from Truffle: ${address}`);
    return address;
  }
  
  // Fallback to environment variable
  const envAddress = process.env.CONTRACT_ADDRESS;
  if (envAddress) {
    console.log(`✅ Using contract address from env: ${envAddress}`);
    return envAddress;
  }
  
  return null;
}

// Load contract instance
function getContractInstance(contractAddress = null) {
  const artifact = loadContractArtifact();
  if (!artifact || !artifact.abi) {
    console.error('❌ Cannot load contract ABI');
    return null;
  }
  
  const address = contractAddress || getContractAddress();
  if (!address) {
    console.error('❌ Contract address not found. Please deploy contract first.');
    return null;
  }
  
  return new web3.eth.Contract(artifact.abi, address);
}

// Helper function để check blockchain connection
async function checkBlockchainConnection() {
  try {
    const isConnected = await web3.eth.net.isListening();
    if (isConnected) {
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(`✅ Blockchain connected. Current block: ${blockNumber}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Blockchain connection error:', error.message);
    return false;
  }
}

// Initialize connection check
checkBlockchainConnection();

module.exports = {
  web3,
  loadContractArtifact,
  getContractAddress,
  getContractInstance,
  checkBlockchainConnection
};

