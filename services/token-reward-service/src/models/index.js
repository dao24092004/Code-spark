// src/models/index.js
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('../config/db.js').development;

const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Đọc tất cả các file model trong thư mục hiện tại
fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js' && file.slice(-9) === '.model.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

// Thiết lập mối quan hệ giữa các model
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Ví dụ thiết lập mối quan hệ: Một User có nhiều Reward
db.User.hasMany(db.Reward, { foreignKey: 'studentId' });
db.Reward.belongsTo(db.User, { foreignKey: 'studentId' });


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;