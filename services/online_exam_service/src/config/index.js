 // file: src/config/index.js
const dotenv = require('dotenv');
dotenv.config(); // Tự động đọc file .env ở thư mục gốc

const config = {
  serverPort: process.env.PORT,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'postgres',
  },
  blockchain: {
    providerUrl: process.env.WEB3_PROVIDER_URL,
    contractAddress: process.env.GRADE_LEDGER_CONTRACT_ADDRESS,
    privateKey: process.env.OWNER_ACCOUNT_PRIVATE_KEY,
  },
  proctoringServiceUrl: process.env.PROCTORING_SERVICE_URL,
};

module.exports = config;
