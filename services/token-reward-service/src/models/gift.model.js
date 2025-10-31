// src/models/gift.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Gift = sequelize.define('Gift', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            field: 'id'
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'name'
        },
        description: {
            type: DataTypes.TEXT,
            field: 'description'
        },
        imageUrl: {
            type: DataTypes.STRING(255),
            field: 'image_url'
        },
        tokenPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'token_price',
            validate: {
                min: 1
            }
        },
        stockQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'stock_quantity',
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'category'
        }
    }, {
        tableName: 'cm_gifts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Gift;
};

