require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { WEB3_PROVIDER_URL, ACCOUNT_PRIVATE_KEY } = process.env;

// Debug (optional)
console.log("WEB3_PROVIDER_URL:", WEB3_PROVIDER_URL);
if (ACCOUNT_PRIVATE_KEY) {
  console.log("ACCOUNT_PRIVATE_KEY:", ACCOUNT_PRIVATE_KEY.slice(0, 10) + "...");
} else {
  console.warn("⚠️  ACCOUNT_PRIVATE_KEY is not set in .env");
}

module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: WEB3_PROVIDER_URL,
      accounts: [ACCOUNT_PRIVATE_KEY],
      chainId: 1337
    }
  }
};
