// Migration script to add missing enum values
// Run this with: node scripts/add_enum_values.js

const { sequelize } = require('../src/models');

async function addEnumValues() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Add 'ADMIN_WARNING' to event_type_enum
    try {
      await sequelize.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'ADMIN_WARNING' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type_enum')
            ) THEN
                ALTER TYPE event_type_enum ADD VALUE 'ADMIN_WARNING';
            END IF;
        END $$;
      `);
      console.log('✅ Added ADMIN_WARNING to event_type_enum');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  ADMIN_WARNING already exists in event_type_enum');
      } else {
        throw error;
      }
    }

    // Add 'terminated' to session_status_enum
    try {
      await sequelize.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'terminated' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'session_status_enum')
            ) THEN
                ALTER TYPE session_status_enum ADD VALUE 'terminated';
            END IF;
        END $$;
      `);
      console.log('✅ Added terminated to session_status_enum');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  terminated already exists in session_status_enum');
      } else {
        throw error;
      }
    }

    // Verify the changes
    const [eventTypes] = await sequelize.query(`
      SELECT enumlabel as event_type 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type_enum') 
      ORDER BY enumsortorder;
    `);
    console.log('\n📋 Current event_type_enum values:');
    eventTypes.forEach(row => console.log(`   - ${row.event_type}`));

    const [sessionStatuses] = await sequelize.query(`
      SELECT enumlabel as session_status 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'session_status_enum') 
      ORDER BY enumsortorder;
    `);
    console.log('\n📋 Current session_status_enum values:');
    sessionStatuses.forEach(row => console.log(`   - ${row.session_status}`));

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the migration
addEnumValues();

