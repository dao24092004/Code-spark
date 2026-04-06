// src/config/db.js
// crypto_db - dùng chung cho copyright, multisig, token-reward
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'crypto_db', // CRYPTO DB - dùng chung
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },
  production: {
    // Cấu hình cho môi trường production sau này
  }
};