// scripts/populate-db.js
const db = require('../src/models');
const { users, rewards } = require('../seed');

const populateDatabase = async () => {
  try {
    // Using `force: true` will drop the tables if they already exist. 
    // Be cautious with this in a production environment.
    await db.sequelize.sync({ force: true });

    await db.User.bulkCreate(users, { ignoreDuplicates: true });
    await db.Reward.bulkCreate(rewards, { ignoreDuplicates: true });

    console.log('Sample data has been inserted successfully.');
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await db.sequelize.close();
  }
};

populateDatabase();
