// src/models/organizationMember.model.js

// Hàm này sẽ được file index.js gọi
module.exports = (sequelize, DataTypes) => {
  const OrganizationMember = sequelize.define('OrganizationMember', {
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
    userId: { 
      type: DataTypes.BIGINT, 
      allowNull: false, 
      field: 'user_id' 
    },
    orgRole: { 
      type: DataTypes.STRING(50), 
      allowNull: false, 
      field: 'org_role' 
    }
  }, {
    tableName: 'organization_members',
    timestamps: true,
    createdAt: 'joined_at',
    updatedAt: false // Bảng này không có 'updated_at'
  });

  return OrganizationMember;
};