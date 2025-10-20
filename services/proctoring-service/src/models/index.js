// file: src/models/index.js

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config'); // Giả sử bạn có file config/index.js
const fs = require('fs');
const path = require('path');

// 1. Khởi tạo kết nối Sequelize từ file config
const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,            // ✅ thêm dòng này
    dialect: config.db.dialect,      // ✅ dùng đúng giá trị từ .env
    logging: false, // Tắt log SQL cho đỡ rối terminal
  }
);

const db = {};

// 2. Tự động đọc tất cả các file model trong thư mục hiện tại
fs.readdirSync(__dirname)
  .filter(file => {
    // Lọc ra các file javascript, không phải là file index.js này
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    // Import và khởi tạo model, truyền sequelize và DataTypes vào
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// 3. Thiết lập mối quan hệ giữa các model
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Gán sequelize và Sequelize vào object db để có thể sử dụng ở nơi khác
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// --- ĐỊNH NGHĨA MỐI QUAN HỆ Ở ĐÂY ---
// Mối quan hệ: Một ExamSession có nhiều ProctoringEvent
db.ExamSession.hasMany(db.ProctoringEvent, {
  foreignKey: 'sessionId',
  as: 'events',
});
db.ProctoringEvent.belongsTo(db.ExamSession, {
  foreignKey: 'sessionId',
  as: 'session',
});

// Mối quan hệ: Một ProctoringEvent có nhiều MediaCapture
db.ProctoringEvent.hasMany(db.MediaCapture, {
  foreignKey: 'eventId',
  as: 'captures',
});
db.MediaCapture.belongsTo(db.ProctoringEvent, {
  foreignKey: 'eventId',
  as: 'event',
});

module.exports = db;