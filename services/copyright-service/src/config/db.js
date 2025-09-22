const { Sequelize } = require('sequelize');

const PG_HOST = process.env.PG_HOST || 'localhost';
const PG_PORT = process.env.PG_PORT || 5432;
const PG_DATABASE = process.env.PG_DATABASE || 'copyright_db';
const PG_USER = process.env.PG_USER || 'user';
const PG_PASSWORD = process.env.PG_PASSWORD || 'password';

const sequelize = new Sequelize(PG_DATABASE, PG_USER, PG_PASSWORD, {
    host: PG_HOST,
    port: PG_PORT,
    dialect: 'postgres',
    logging: false, // console.log,
});

module.exports = sequelize;