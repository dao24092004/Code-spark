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
        logging: config.server.env === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;

