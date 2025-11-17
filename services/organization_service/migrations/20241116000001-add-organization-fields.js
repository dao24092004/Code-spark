'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm các cột mới vào bảng organizations
    await queryInterface.addColumn('organizations', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'short_description', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'logo', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'website', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'address', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'city', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'country', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: 'Việt Nam'
    });

    await queryInterface.addColumn('organizations', 'postal_code', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'founded_year', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'revenue', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('organizations', 'currency', {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: 'VND'
    });

    await queryInterface.addColumn('organizations', 'employees', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('organizations', 'departments', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('organizations', 'subscription_plan', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'free'
    });

    await queryInterface.addColumn('organizations', 'subscription_status', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'active'
    });

    await queryInterface.addColumn('organizations', 'subscription_expiry', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'tags', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of tags'
    });

    await queryInterface.addColumn('organizations', 'contact_person', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON object with contact person details'
    });

    await queryInterface.addColumn('organizations', 'social_media', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON object with social media links'
    });

    await queryInterface.addColumn('organizations', 'settings', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON object with organization settings'
    });

    await queryInterface.addColumn('organizations', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('organizations', 'is_premium', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('organizations', 'verification_status', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'not_verified'
    });

    await queryInterface.addColumn('organizations', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('organizations', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Đổi tên cột imageUrl thành logo nếu chưa có
    // (Nếu đã có imageUrl, có thể giữ lại hoặc migrate data)
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa các cột đã thêm
    await queryInterface.removeColumn('organizations', 'description');
    await queryInterface.removeColumn('organizations', 'short_description');
    await queryInterface.removeColumn('organizations', 'logo');
    await queryInterface.removeColumn('organizations', 'website');
    await queryInterface.removeColumn('organizations', 'email');
    await queryInterface.removeColumn('organizations', 'phone');
    await queryInterface.removeColumn('organizations', 'address');
    await queryInterface.removeColumn('organizations', 'city');
    await queryInterface.removeColumn('organizations', 'country');
    await queryInterface.removeColumn('organizations', 'postal_code');
    await queryInterface.removeColumn('organizations', 'founded_year');
    await queryInterface.removeColumn('organizations', 'revenue');
    await queryInterface.removeColumn('organizations', 'currency');
    await queryInterface.removeColumn('organizations', 'employees');
    await queryInterface.removeColumn('organizations', 'departments');
    await queryInterface.removeColumn('organizations', 'subscription_plan');
    await queryInterface.removeColumn('organizations', 'subscription_status');
    await queryInterface.removeColumn('organizations', 'subscription_expiry');
    await queryInterface.removeColumn('organizations', 'tags');
    await queryInterface.removeColumn('organizations', 'contact_person');
    await queryInterface.removeColumn('organizations', 'social_media');
    await queryInterface.removeColumn('organizations', 'settings');
    await queryInterface.removeColumn('organizations', 'is_active');
    await queryInterface.removeColumn('organizations', 'is_premium');
    await queryInterface.removeColumn('organizations', 'verification_status');
    await queryInterface.removeColumn('organizations', 'notes');
    await queryInterface.removeColumn('organizations', 'last_login_at');
  }
};
