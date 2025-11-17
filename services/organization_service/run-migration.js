// Script để chạy migration
require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Cấu hình database - Sử dụng ORGANIZATION_DB từ .env
const sequelize = new Sequelize(
  process.env.ORGANIZATION_DB_NAME || 'organization_db',
  process.env.ORGANIZATION_DB_USER || 'postgres',
  process.env.ORGANIZATION_DB_PASSWORD || 'password',
  {
    host: process.env.ORGANIZATION_DB_HOST || 'localhost',
    port: process.env.ORGANIZATION_DB_PORT || 5433,
    dialect: 'postgres',
    logging: console.log
  }
);

async function runMigration() {
  try {
    console.log('🔄 Đang kết nối database...');
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');

    // Đọc file migration
    const migrationPath = path.join(__dirname, 'migrations', '20241116000001-add-organization-fields.js');
    const migration = require(migrationPath);

    console.log('🔄 Đang chạy migration...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log('✅ Migration hoàn tất!');

    console.log('\n📊 Kiểm tra cấu trúc bảng organizations:');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'organizations'
      ORDER BY ordinal_position;
    `);
    
    console.table(results);

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n✅ Đã đóng kết nối database');
  }
}

// Chạy migration
runMigration();
