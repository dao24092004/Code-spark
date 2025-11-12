const { ethers } = require('ethers');
const tokenArtifact = require('../artifacts/contracts/Token.sol/Token.json');

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');

async function main() {
  const txHash = process.argv[2];
  if (!txHash) {
    console.error('Usage: node scripts/checkTx.js <txHash>');
    process.exit(1);
  }

  const tx = await provider.getTransaction(txHash);
  console.log('Transaction:', tx);

  const receipt = await provider.getTransactionReceipt(txHash);
  console.log('Receipt:', receipt);

  if (receipt?.logs?.length) {
    const iface = new ethers.Interface(tokenArtifact.abi);
    console.log('Decoded logs:');
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        console.log(parsed);
      } catch (err) {
        console.log('Non-token log:', log);
      }
    }
  } else {
    console.log('No logs found');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

