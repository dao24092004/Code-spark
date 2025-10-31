import "@nomicfoundation/hardhat-toolbox";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",
    },
  },
});
