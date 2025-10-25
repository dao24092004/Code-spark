 // scripts/deploy-contracts.js
const hre = require("hardhat");

async function main() {
  const initialSupply = 1000000; // 1 triệu token

  console.log("Đang biên dịch và chuẩn bị triển khai Token...");
  
  const token = await hre.ethers.deployContract("Token", [initialSupply]);

  await token.waitForDeployment();

  console.log(`✅ Token đã được triển khai thành công!`);
  console.log(`Địa chỉ Contract: ${token.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
