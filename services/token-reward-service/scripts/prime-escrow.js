// scripts/prime-escrow.js
const hre = require("hardhat");

async function main() {
  const {
    CONTRACT_ADDRESS,
    ESCROW_CONTRACT_ADDRESS,
    ACCOUNT_PRIVATE_KEY
  } = process.env;

  if (!CONTRACT_ADDRESS || !ESCROW_CONTRACT_ADDRESS || !ACCOUNT_PRIVATE_KEY) {
    console.error("Vui lòng kiểm tra CONTRACT_ADDRESS, ESCROW_CONTRACT_ADDRESS, và ACCOUNT_PRIVATE_KEY trong .env");
    return;
  }

  // Số lượng 500,000 token (với 18 số 0)
  const amountToPrime = hre.ethers.parseUnits("500000", 18); 

  // Kết nối với ví Admin
  const adminWallet = new hre.ethers.Wallet(ACCOUNT_PRIVATE_KEY, hre.ethers.provider);

  // Lấy 2 hợp đồng
  const token = await hre.ethers.getContractAt("Token", CONTRACT_ADDRESS, adminWallet);
  const escrow = await hre.ethers.getContractAt("RewardEscrow", ESCROW_CONTRACT_ADDRESS, adminWallet);

  console.log(`Kiểm tra số dư CST của Admin (${adminWallet.address})...`);
  const adminBalance = await token.balanceOf(adminWallet.address);
  console.log(`Số dư Admin: ${hre.ethers.formatUnits(adminBalance, 18)} CST`);

  if (adminBalance < amountToPrime) {
    console.error("Ví Admin không đủ token để nạp.");
    return;
  }

  console.log(`\nBước 1: Approve Escrow (${ESCROW_CONTRACT_ADDRESS}) được tiêu 500k CST từ Ví Admin...`);
  // Ví Admin (token.approve) cho phép Escrow rút 500k
  const approveTx = await token.approve(ESCROW_CONTRACT_ADDRESS, amountToPrime);
  await approveTx.wait();
  console.log(`✅ Approve thành công, hash: ${approveTx.hash}`);

  console.log(`\nBước 2: Gọi deposit() trên Escrow để nạp 500k CST...`);
  // Ví Admin gọi hàm deposit() của Escrow
  // Hàm deposit() sẽ tự động rút (transferFrom) 500k token đã được approve ở trên
  const depositTx = await escrow.deposit(amountToPrime); 
  await depositTx.wait();
  console.log(`✅ Nạp tiền cho Escrow thành công, hash: ${depositTx.hash}`);

  console.log(`\nKiểm tra số dư Escrow...`);
  const escrowBalance = await token.balanceOf(ESCROW_CONTRACT_ADDRESS);
  console.log(`💰 Số dư Escrow hiện tại: ${hre.ethers.formatUnits(escrowBalance, 18)} CST`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});