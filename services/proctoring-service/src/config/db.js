const { Sequelize } = require('sequelize');
const config = require('./index');

const dbConfig = config.db;

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false
  }
);

module.exports = sequelize;