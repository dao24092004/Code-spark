// src/models/organizationInvitation.model.js
module.exports = (sequelize, DataTypes) => {
  const OrganizationInvitation = sequelize.define('OrganizationInvitation', {
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING', // PENDING, ACCEPTED, REJECTED, EXPIRED
      field: 'status'
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'invited_by'
    },
    invitedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'invited_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'accepted_at'
    }
  }, {
    tableName: 'organization_invitations',
    timestamps: true,
    createdAt: 'invited_at',
    updatedAt: false // Chỉ có invited_at
  });

  return OrganizationInvitation;
};
