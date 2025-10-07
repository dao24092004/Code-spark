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
    ownerAddress: {
        type: DataTypes.STRING,
    },
    transactionHash: {
        type: DataTypes.STRING,
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