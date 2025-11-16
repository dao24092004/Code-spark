const { Sequelize } = require('sequelize');
const config = require('./index'); // Import file config/index.js

// 1. Kết nối đến profile_db (CHỈ CHO PROFILES)
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

// 2. Kết nối đến organization_db (CHO ORGANIZATIONS, MEMBERS, RECRUITMENT)
const organizationDbSequelize = new Sequelize(
  config.organizationDb.database,
  config.organizationDb.username,
  config.organizationDb.password,
  {
    host: config.organizationDb.host,
    port: config.organizationDb.port,
    dialect: config.organizationDb.dialect,
    logging: false,
  }
);

// 3. Kết nối đến identity_db (ĐỌC)
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

// 4. Kết nối đến course_db (ĐỌC)
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

// Xuất tất cả kết nối
module.exports = {
  profileDbSequelize,
  organizationDbSequelize, // THÊM MỚI
  identityDbSequelize,
  courseDbSequelize,
};