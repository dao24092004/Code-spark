// scripts/deploy-contracts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// [BEGIN] Copy từ file gốc của bạn [cite: 134-155]
const SERVICE_ENV_PATH = path.resolve(__dirname, "../.env");
const FRONTEND_ENV_PATH = path.resolve(__dirname, "../../../..", "web-frontend", ".env"); // Sẽ báo lỗi, không sao

function updateEnvFile(filePath, key, value) {
  try {
    let content = "";
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, "utf8");
    }
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(content)) {
      content = content.replace(pattern, `${key}=${value}`);
    } else {
      const needsNewline = content.length > 0 && !content.endsWith("\n");
      content = `${content}${needsNewline ? "\n" : ""}${key}=${value}\n`;
    }
    fs.writeFileSync(filePath, content);
    console.log(`🔄 Đã cập nhật ${key} trong ${path.relative(process.cwd(), filePath)}`);
  } catch (error) {
    console.warn(`⚠️ Không thể cập nhật ${path.relative(process.cwd(), filePath)}: ${error.message}`);
  }
}
// [END] Copy từ file gốc của bạn

async function main() {
  const initialSupply = 1_000_000; // 1 triệu token
  console.log("🔧 Đang biên dịch hợp đồng...");
  await hre.run("compile");

  // Lấy signer (sẽ là ví admin từ .env nếu cấu hình hardhat đúng)
  const [deployer] = await hre.ethers.getSigners();
  console.log(` deploy bằng tài khoản: ${deployer.address}`);

  // =================================================================
  // Deploy 1: Token.sol
  // =================================================================
  console.log(`🚀 Triển khai Token.sol lên network "${hre.network.name}"...`);
  const token = await hre.ethers.deployContract("Token", [initialSupply]);
  await token.waitForDeployment();
  const tokenAddress = token.target;
  
  console.log(`✅ Token.sol đã được triển khai!`);
  console.log(`🏷️  CONTRACT_ADDRESS: ${tokenAddress}`);
  
  // =================================================================
  // Deploy 2: RewardEscrow.sol
  // =================================================================
  console.log(`\n🚀 Triển khai RewardEscrow.sol lên network "${hre.network.name}"...`);
  // Hợp đồng Escrow cần địa chỉ của hợp đồng Token khi khởi tạo [cite: 17-20]
  const escrow = await hre.ethers.deployContract("RewardEscrow", [tokenAddress]);
  await escrow.waitForDeployment();
  const escrowAddress = escrow.target;
  
  console.log(`✅ RewardEscrow.sol đã được triển khai!`);
  console.log(`🏷️  ESCROW_CONTRACT_ADDRESS: ${escrowAddress}`);

  // =================================================================
  // Cập nhật file .env
  // =================================================================
  console.log("\n🔄 Đang cập nhật file .env...");
  updateEnvFile(SERVICE_ENV_PATH, "CONTRACT_ADDRESS", tokenAddress);
  updateEnvFile(SERVICE_ENV_PATH, "ESCROW_CONTRACT_ADDRESS", escrowAddress);
  updateEnvFile(FRONTEND_ENV_PATH, "VITE_LEARN_TOKEN_ADDRESS", tokenAddress); // Sẽ báo lỗi, không sao
  
  console.log("\nℹ️  Nhớ khởi động lại backend và frontend sau khi cập nhật biến môi trường.");
}

main().catch((error) => {
  console.error("❌ Deploy thất bại:", error);
  process.exitCode = 1;
});