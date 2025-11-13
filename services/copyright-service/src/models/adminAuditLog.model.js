const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'ID of the admin who performed the action'
    },
    action: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Description of the action performed'
    },
    targetId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID of the target entity (e.g., copyright ID)'
    },
    targetType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Type of the target entity (e.g., copyright, user, etc.)'
    },
    details: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Additional details about the action in JSON format'
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'IP address of the admin when performing the action'
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'User agent string of the admin\'s browser/device'
    },
    txHash: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Blockchain transaction hash for this action'
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
        defaultValue: 'pending',
        comment: 'Status of the blockchain transaction'
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['adminId']
        },
        {
            fields: ['targetId']
        },
        {
            fields: ['createdAt']
        },
        {
            fields: ['action']
        },
        {
            fields: ['txHash'],
            unique: true
        }
    ]
});

// Add hooks for automatic targetType setting
AdminAuditLog.beforeCreate((auditLog) => {
    // Automatically set targetType based on targetId format if not provided
    if (auditLog.targetId && !auditLog.targetType) {
        // Example: If targetId is a UUID, it's likely a copyright
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(auditLog.targetId)) {
            auditLog.targetType = 'copyright';
        }
        // Add more patterns as needed
    }
    return auditLog;
});

module.exports = AdminAuditLog;
