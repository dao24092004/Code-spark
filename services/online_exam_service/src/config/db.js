// file: src/config/db.js
// Dead code — models/index.js đã tự tạo Sequelize instance.
// Chỉ giữ lại để tránh import lỗi nếu có file nào đó tham chiếu.
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'exam_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5433,
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
