const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentSimilarity = sequelize.define('DocumentSimilarity', {
    sourceDocumentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Copyrights',
            key: 'id'
        }
    },
    targetDocumentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Copyrights',
            key: 'id'
        }
    },
    similarityScore: {
        type: DataTypes.DECIMAL(5, 4), // e.g., 0.8543 (up to 4 decimal places)
        allowNull: false,
    },
    comparedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['sourceDocumentId', 'targetDocumentId']
        },
        {
            fields: ['sourceDocumentId']
        },
        {
            fields: ['targetDocumentId']
        }
    ]
});

// Define associations
DocumentSimilarity.associate = (models) => {
    DocumentSimilarity.belongsTo(models.Copyright, {
        foreignKey: 'sourceDocumentId',
        as: 'sourceDocument'
    });
    DocumentSimilarity.belongsTo(models.Copyright, {
        foreignKey: 'targetDocumentId',
        as: 'targetDocument'
    });
};

module.exports = DocumentSimilarity;
