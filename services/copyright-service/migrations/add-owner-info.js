// Migration to add ownerUsername and ownerEmail fields to Copyright table

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Copyrights', 'ownerUsername', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Username of the person who uploaded the document'
    });

    await queryInterface.addColumn('Copyrights', 'ownerEmail', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Email of the person who uploaded the document'
    });

    console.log('✅ Added ownerUsername and ownerEmail columns to Copyrights table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Copyrights', 'ownerUsername');
    await queryInterface.removeColumn('Copyrights', 'ownerEmail');
    
    console.log('✅ Removed ownerUsername and ownerEmail columns from Copyrights table');
  }
};

