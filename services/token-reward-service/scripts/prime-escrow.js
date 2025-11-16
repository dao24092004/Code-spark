// scripts/prime-escrow.js
// Make this script runnable with plain `node` (without hardhat CLI)
require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  const {
    WEB3_PROVIDER_URL,
    CONTRACT_ADDRESS,
    ESCROW_CONTRACT_ADDRESS,
    ACCOUNT_PRIVATE_KEY,
  } = process.env;

  if (!WEB3_PROVIDER_URL) {
    throw new Error("WEB3_PROVIDER_URL is missing in .env");
  }
  if (!CONTRACT_ADDRESS || !ESCROW_CONTRACT_ADDRESS || !ACCOUNT_PRIVATE_KEY) {
    throw new Error("CONTRACT_ADDRESS, ESCROW_CONTRACT_ADDRESS, or ACCOUNT_PRIVATE_KEY is missing in .env");
  }

  const provider = new ethers.JsonRpcProvider(WEB3_PROVIDER_URL);
  const adminWallet = new ethers.Wallet(ACCOUNT_PRIVATE_KEY, provider);

  // Minimal ERC20 ABI for balanceOf / approve / transferFrom
  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

  // Minimal Escrow ABI for deposit
  const escrowAbi = [
    "function deposit(uint256 amount)",
  ];

  const token = new ethers.Contract(CONTRACT_ADDRESS, erc20Abi, adminWallet);
  const escrow = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, escrowAbi, adminWallet);

  // 500,000 tokens with 18 decimals
  const amountToPrime = ethers.parseUnits("500000", 18);

  console.log(`WEB3_PROVIDER_URL: ${WEB3_PROVIDER_URL}`);
  console.log(`Admin: ${adminWallet.address}`);
  console.log(`Token: ${CONTRACT_ADDRESS}`);
  console.log(`Escrow: ${ESCROW_CONTRACT_ADDRESS}`);

  // Verify bytecode exists at token address to avoid BAD_DATA
  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (code === "0x") {
    throw new Error(`No contract deployed at ${CONTRACT_ADDRESS} on ${WEB3_PROVIDER_URL}`);
  }

  console.log(`Kiểm tra số dư token của Admin...`);
  const adminBal = await token.balanceOf(adminWallet.address);
  console.log(`Số dư Admin: ${ethers.formatUnits(adminBal, 18)} tokens`);
  if (adminBal < amountToPrime) {
    throw new Error("Ví Admin không đủ token để nạp vào Escrow.");
  }

  // Force legacy gas (avoid EIP-1559 on some Ganache builds)
  const legacyGasPrice = ethers.parseUnits("1", "gwei");
  // Fetch pending nonce to avoid "tx doesn't have the correct nonce" on Ganache
  const baseNonce = await provider.getTransactionCount(adminWallet.address, "pending");
  const approveOverrides = { gasPrice: legacyGasPrice, gasLimit: 200000, type: 0, nonce: baseNonce };
  const depositOverrides = { gasPrice: legacyGasPrice, gasLimit: 300000, type: 0, nonce: baseNonce + 1 };

  console.log(`\nBước 1: Approve Escrow được phép tiêu 500k tokens...`);
  const approveTx = await token.approve(ESCROW_CONTRACT_ADDRESS, amountToPrime, approveOverrides);
  await approveTx.wait();
  console.log(`✅ Approve thành công: ${approveTx.hash}`);

  console.log(`\nBước 2: Gọi escrow.deposit(500k)...`);
  const depositTx = await escrow.deposit(amountToPrime, depositOverrides);
  await depositTx.wait();
  console.log(`✅ Nạp vào Escrow thành công: ${depositTx.hash}`);

  // Reuse ERC20 balanceOf to verify escrow balance
  const escrowBal = await token.balanceOf(ESCROW_CONTRACT_ADDRESS);
  console.log(`💰 Số dư Escrow hiện tại: ${ethers.formatUnits(escrowBal, 18)} tokens`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});