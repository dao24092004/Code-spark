// scripts/deploy-contracts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const SERVICE_ENV_PATH = path.resolve(__dirname, "../.env");
const FRONTEND_ENV_PATH = path.resolve(__dirname, "../../../..", "web-frontend", ".env");

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

async function main() {
  const initialSupply = 1_000_000; // 1 triệu token

  console.log("🔧 Đang biên dịch hợp đồng...");
  await hre.run("compile");

  console.log(`🚀 Triển khai Token lên network "${hre.network.name}"...`);
  const token = await hre.ethers.deployContract("Token", [initialSupply]);
  await token.waitForDeployment();

  const contractAddress = token.target;
  console.log(`✅ Token đã được triển khai thành công!`);
  console.log(`🏷️  CONTRACT_ADDRESS: ${contractAddress}`);

  updateEnvFile(SERVICE_ENV_PATH, "CONTRACT_ADDRESS", contractAddress);
  updateEnvFile(FRONTEND_ENV_PATH, "VITE_LEARN_TOKEN_ADDRESS", contractAddress);

  console.log("ℹ️  Nhớ khởi động lại backend và frontend sau khi cập nhật biến môi trường.");
}

main().catch((error) => {
  console.error("❌ Deploy thất bại:", error);
  process.exitCode = 1;
});
