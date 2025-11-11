require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

console.log("WEB3_PROVIDER_URL:", process.env.WEB3_PROVIDER_URL);
console.log("ACCOUNT_PRIVATE_KEY:", process.env.ACCOUNT_PRIVATE_KEY?.slice(0, 10) + "...");

const { WEB3_PROVIDER_URL, ACCOUNT_PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: WEB3_PROVIDER_URL,
      accounts: [ACCOUNT_PRIVATE_KEY]
    }
  }
};
