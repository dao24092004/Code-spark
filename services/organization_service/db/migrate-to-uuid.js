/**
 * db/migrate-to-uuid.js
 * Migration script để chuyển các cột BIGINT → UUID trong organization_db
 * 
 * Chạy: node db/migrate-to-uuid.js
 */

const { organizationDbSequelize } = require('../src/config/db');

async function migrateToUuid() {
  console.log('Bắt đầu migration BIGINT → UUID...');

  try {
    // Lấy danh sách các bảng trong schema hiện tại
    const tables = await organizationDbSequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
      { type: organizationDbSequelize.QueryTypes.SELECT }
    );

    if (!tables || tables.length === 0) {
      console.log('  Không có bảng nào.');
      return;
    }

    console.log('Các bảng:', tables.map(t => t.table_name).join(', '));

    for (const row of tables) {
      const tableName = row.table_name;
      if (!tableName) continue;
      await migrateTable(tableName);
    }

    console.log('\n✅ Migration hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi migration:', error.message);
    throw error;
  } finally {
    await organizationDbSequelize.close();
  }
}

async function migrateTable(tableName) {
  console.log(`\n--- Migration bảng: ${tableName} ---`);

  try {
    // Lấy danh sách cột BIGINT cần chuyển sang UUID
    const bigintColumns = await organizationDbSequelize.query(
      `SELECT column_name, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = '` + tableName + `'
         AND data_type = 'bigint'`,
      { type: organizationDbSequelize.QueryTypes.SELECT }
    );

    if (bigintColumns.length === 0) {
      console.log(`  ✓ Không có cột BIGINT nào cần migrate`);
      return;
    }

    for (const col of bigintColumns) {
      const columnName = col.column_name;

      // Kiểm tra có dữ liệu NULL không
      const hasNulls = await organizationDbSequelize.query(
        `SELECT EXISTS(SELECT 1 FROM "` + tableName + `" WHERE "` + columnName + `" IS NULL) as has_nulls`,
        { type: organizationDbSequelize.QueryTypes.SELECT }
      );

      if (hasNulls.length > 0 && hasNulls[0].has_nulls) {
        console.log(`  ⚠ Cột "${columnName}" có giá trị NULL → DROP NOT NULL...`);
        await organizationDbSequelize.query(
          `ALTER TABLE "` + tableName + `" ALTER COLUMN "` + columnName + `" DROP NOT NULL`
        );
      }

      // Chuyển BIGINT → UUID
      console.log(`  → "${columnName}": BIGINT → UUID...`);
      await organizationDbSequelize.query(
        `ALTER TABLE "` + tableName + `" ALTER COLUMN "` + columnName + `" TYPE UUID USING ("` + columnName + `"::text::uuid)`
      );
      console.log(`  ✓ Hoàn thành: "${columnName}"`);
    }

  } catch (error) {
    console.error(`  ❌ Lỗi khi migrate bảng ${tableName}:`, error.message);
  }
}

// Chạy migration
migrateToUuid();
