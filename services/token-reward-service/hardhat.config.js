 // hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Để đọc file .env

const { WEB3_PROVIDER_URL, ACCOUNT_PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: WEB3_PROVIDER_URL,
      accounts: [ACCOUNT_PRIVATE_KEY]
    }
  }
};
