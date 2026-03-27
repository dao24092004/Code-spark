// src/models/organizationMember.model.js
// Theo ERD: organization_members - Role được quản lý qua user_roles (organization_id scoped)
// Không có role trong bảng này để tránh xung đột quyền
module.exports = (sequelize, DataTypes) => {
  const OrganizationMember = sequelize.define('OrganizationMember', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING',  // PENDING, ACTIVE, SUSPENDED
      field: 'status'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'joined_at'
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'invited_by'
    }
  }, {
    tableName: 'organization_members',
    timestamps: true,
    createdAt: 'joined_at',
    updatedAt: false // Bảng này chỉ có joined_at, không có updated_at
  });

  return OrganizationMember;
};
