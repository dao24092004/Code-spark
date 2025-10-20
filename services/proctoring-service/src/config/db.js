const { Sequelize } = require('sequelize');
const config = require('./index'); // Import cấu hình trung tâm

const dbConfig = config.database; // Lấy thông tin cấu hình database

// Tạo một INSTANCE (thực thể) Sequelize mới với thông tin kết nối
const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: false, // Tắt log SQL cho gọn, có thể bật 'true' để debug
  }
);

// Quan trọng: Xuất ra chính INSTANCE sequelize này
// để các file model có thể sử dụng nó và gọi .define()
module.exports = sequelize;