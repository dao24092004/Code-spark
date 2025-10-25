// src/config/db.js
require('dotenv').config();

module.exports = {
  development: {
    // Các tên biến này phải khớp 100% với file .env
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10), // Chuyển port sang kiểu số
    dialect: 'postgres'
  },
  production: {
    // Cấu hình cho môi trường production sau này
  }
};