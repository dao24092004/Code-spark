// scripts/add-test-user.js
const db = require('../src/models');

const addTestUser = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Tạo hoặc cập nhật user id 4
    const [user, created] = await db.User.findOrCreate({
      where: { id: 4 },
      defaults: {
        id: 4,
        tokenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    if (created) {
      console.log('✅ Created test user with id: 4');
    } else {
      console.log('ℹ️  User id 4 already exists. Token balance:', user.tokenBalance);
    }

    // Hiển thị tất cả users
    const allUsers = await db.User.findAll({
      attributes: ['id', 'tokenBalance']
    });
    console.log('\n📊 All users in database:');
    allUsers.forEach(u => {
      console.log(`  - User ID: ${u.id}, Balance: ${u.tokenBalance}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.sequelize.close();
  }
};

addTestUser();

