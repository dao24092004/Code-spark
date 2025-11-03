require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: process.env.WEB3_HOST || "127.0.0.1",
      port: process.env.WEB3_PORT || 7545,
      network_id: process.env.NETWORK_ID || 5777, // Ganache default network ID
      gas: 6721975,
      gasPrice: 20000000000,
      from: process.env.DEPLOYER_ADDRESS || undefined
    },
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
      gas: 6721975,
      gasPrice: 20000000000
    }
  },

  compilers: {
    solc: {
      version: "0.8.30",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  contracts_directory: './contracts',
  migrations_directory: './migrations',
  contracts_build_directory: './build/contracts'
};

