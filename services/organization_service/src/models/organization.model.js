// src/models/organization.model.js

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    id: { 
      type: DataTypes.BIGINT, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    ownerId: { 
      type: DataTypes.BIGINT, 
      allowNull: false, 
      field: 'owner_id' 
    },
    imageUrl: { 
      type: DataTypes.TEXT, 
      field: 'image_url' 
    },
    orgType: { 
      type: DataTypes.STRING(100), 
      field: 'org_type' 
    },
    orgSize: { 
      type: DataTypes.STRING(100), 
      field: 'org_size' 
    },
    industry: { 
      type: DataTypes.STRING(100) 
    },
    package: { 
      type: DataTypes.STRING(100) 
    },
    status: { 
      type: DataTypes.STRING(50), 
      allowNull: false, 
      defaultValue: 'active' 
    },
    isVerified: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: false, 
      field: 'is_verified' 
    }
  }, {
    tableName: 'organizations',
    
    // --- PHẦN SỬA LỖI NẰM Ở ĐÂY ---
    timestamps: true,      // 1. Báo Sequelize sử dụng timestamps
    createdAt: 'created_at', // 2. Map 'createdAt' của Sequelize -> 'created_at' của DB
    updatedAt: 'updated_at'  // 3. Map 'updatedAt' của Sequelize -> 'updated_at' của DB
  });

  return Organization;
};