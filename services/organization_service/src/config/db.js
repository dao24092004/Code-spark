const { Sequelize } = require('sequelize');
const config = require('./index'); // Import file config/index.js

// 1. Kết nối đến profile_db (GHI)
const profileDbSequelize = new Sequelize(
  config.profileDb.database,
  config.profileDb.username,
  config.profileDb.password,
  {
    host: config.profileDb.host,
    port: config.profileDb.port,
    dialect: config.profileDb.dialect,
    logging: false, // Tắt log SQL
  }
);

// 2. Kết nối đến identity_db (ĐỌC)
const identityDbSequelize = new Sequelize(
  config.identityDb.database,
  config.identityDb.username,
  config.identityDb.password,
  {
    host: config.identityDb.host,
    port: config.identityDb.port,
    dialect: config.identityDb.dialect,
    logging: false,
  }
);

// 3. Kết nối đến course_db (ĐỌC)
const courseDbSequelize = new Sequelize(
  config.courseDb.database,
  config.courseDb.username,
  config.courseDb.password,
  {
    host: config.courseDb.host,
    port: config.courseDb.port,
    dialect: config.courseDb.dialect,
    logging: false,
  }
);

// Xuất cả 3 kết nối
module.exports = {
  profileDbSequelize,
  identityDbSequelize,
  courseDbSequelize,
};