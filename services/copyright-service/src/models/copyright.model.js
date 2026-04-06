// file: src/models/copyright.model.js
// crypto_db: copyrights table (shared with multisig-service, token-reward-service)
// ERD: copyrights(id uuid PK, profile_id uuid FK,
//         crypto_account_id uuid FK, filename, stored_filename,
//         hash UNIQUE, content_hash, transaction_hash,
//         mime_type, file_size, title, author, description, category,
//         created_at, updated_at)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Copyright = sequelize.define('Copyright', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    profileId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'profile_id'
    },
    cryptoAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'crypto_account_id'
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    storedFilename: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    contentHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'content_hash',
        comment: 'MD5 hash of file content for duplicate detection'
    },
    transactionHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'transaction_hash'
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'mime_type'
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'file_size'
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    author: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
}, {
    tableName: 'copyrights',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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
