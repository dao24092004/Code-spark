 // file: src/config/db.js
const { Sequelize } = require('sequelize');
const config = require('./index');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false,
  }
);

module.exports = sequelize;
