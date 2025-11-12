const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Copyright = sequelize.define('Copyright', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    storedFilename: {
        type: DataTypes.STRING,
        allowNull: true,  // Allow null for existing records during migration
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    contentHash: {
        type: DataTypes.STRING,
        allowNull: true,  // Allow null for backward compatibility
        comment: 'MD5 hash of file content for duplicate detection'
    },
    ownerAddress: {
        type: DataTypes.STRING,
        comment: 'User ID or wallet address of the owner'
    },
    ownerUsername: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Username of the person who uploaded the document'
    },
    ownerEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Email of the person who uploaded the document'
    },
    transactionHash: {
        type: DataTypes.STRING,
    },
    mimeType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'MIME type of the uploaded file (e.g., application/pdf, image/jpeg)'
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'File size in bytes'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Document title'
    },
    author: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Document author'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Document description'
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Document category'
    },
}, {
    timestamps: true,
});

// Define associations
Copyright.associate = (models) => {
    Copyright.hasMany(models.DocumentSimilarity, {
        foreignKey: 'sourceDocumentId',
        as: 'sourceSimilarities'
    });
    Copyright.hasMany(models.DocumentSimilarity, {
        foreignKey: 'targetDocumentId',
        as: 'targetSimilarities'
    });
};

module.exports = Copyright;