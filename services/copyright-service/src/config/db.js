const { Sequelize } = require('sequelize');

// Support both PG_* and DB_* env names
const PG_HOST = process.env.PG_HOST || process.env.DB_HOST || 'localhost';
const PG_PORT = parseInt(process.env.PG_PORT || process.env.DB_PORT, 10) || 5433;
const PG_DATABASE = process.env.PG_DATABASE || process.env.DB_NAME || 'copyright_db';
const PG_USER = process.env.PG_USER || process.env.DB_USER || 'postgres';
const PG_PASSWORD = process.env.PG_PASSWORD || process.env.DB_PASSWORD || 'password';

const sequelize = new Sequelize(PG_DATABASE, PG_USER, PG_PASSWORD, {
  host: PG_HOST,
  port: PG_PORT,
  dialect: 'postgres',
  logging: false,
});

// Authenticate and synchronize the database
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database or synchronize models:', error);
  }
})();

module.exports = sequelize;
