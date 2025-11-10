// file: src/config/index.js

require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 8082,
  },
  // --- PHẦN ĐÃ SỬA & BỔ SUNG ---
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proctoring_db',
    dialect: process.env.DB_DIALECT || 'postgres', 
  },
  ai: {
    url: process.env.AI_SERVICE_URL,
  },
  blockchain: {
    providerUrl: process.env.WEB3_PROVIDER_URL,
    privateKey: process.env.ACCOUNT_PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
  },
  security: {
    jwt: {
      secret: process.env.JWT_SECRET,
    },
  },
};

module.exports = config;