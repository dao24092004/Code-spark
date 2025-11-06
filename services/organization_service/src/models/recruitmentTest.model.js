// src/models/recruitmentTest.model.js
module.exports = (sequelize, DataTypes) => {
  const RecruitmentTest = sequelize.define('RecruitmentTest', {
    id: { 
      type: DataTypes.BIGINT, 
      primaryKey: true, 
      autoIncrement: true 
    },
    organizationId: { 
      type: DataTypes.BIGINT, 
      allowNull: false, 
      field: 'organization_id' 
    },
    title: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT 
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_minutes'
    }
  }, {
    tableName: 'recruitment_tests',
    timestamps: true,      // 1. Báo Sequelize sử dụng timestamps
    createdAt: 'created_at', // 2. Map 'createdAt' của Sequelize -> 'created_at' của DB
    updatedAt: false// Bảng của bạn không có 'updated_at'
  });

  return RecruitmentTest;
};