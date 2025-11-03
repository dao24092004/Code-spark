// Configuration file cho multisig-service
require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'multisig_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },

  blockchain: {
    providerUrl: process.env.WEB3_PROVIDER_URL || 'http://localhost:7545',
    networkId: process.env.NETWORK_ID || 5777,
    gasLimit: 6721975,
    gasPrice: 20000000000
  },

  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    }
  }
};

module.exports = config;

