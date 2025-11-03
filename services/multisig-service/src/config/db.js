const { Sequelize } = require('sequelize');
const config = require('./index');

// Support both DB_* and DATABASE_* env names (for docker-compose compatibility)
const dbName = config.database.name || process.env.DB_NAME || process.env.DATABASE_NAME || 'multisig_db';
const dbUser = config.database.user || process.env.DB_USER || process.env.DATABASE_USER || 'postgres';
const dbPassword = config.database.password || process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'password';
const dbHost = config.database.host || process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost';
const dbPort = config.database.port || parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10);

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: config.database.logging
});

module.exports = sequelize;

