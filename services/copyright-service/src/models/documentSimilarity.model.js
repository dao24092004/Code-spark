// file: src/models/documentSimilarity.model.js
// crypto_db: document_similarities table
// ERD: document_similarities(id uuid PK,
//         source_document_id uuid FK, target_document_id uuid FK,
//         similarity_score decimal(5,4), created_at)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentSimilarity = sequelize.define('DocumentSimilarity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    sourceDocumentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'source_document_id'
    },
    targetDocumentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'target_document_id'
    },
    similarityScore: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        field: 'similarity_score'
    },
}, {
    tableName: 'document_similarities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['source_document_id', 'target_document_id'],
            name: 'uk_doc_similarity_pair'
        },
        {
            fields: ['source_document_id'],
            name: 'idx_doc_similarity_source'
        },
        {
            fields: ['target_document_id'],
            name: 'idx_doc_similarity_target'
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
