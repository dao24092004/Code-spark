require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./index');

const sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.pass,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: 'postgres',
        logging: false, // Tắt logging SQL
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;