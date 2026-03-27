// ERD: gifts(id uuid PK, sender_id uuid, recipient_id uuid,
//         crypto_account_id uuid, amount bigint, token_symbol,
//         message, status, tx_hash, created_at) — KHÔNG có updated_at

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Gift = sequelize.define('Gift', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            field: 'id'
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'sender_id'
        },
        recipientId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'recipient_id'
        },
        cryptoAccountId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'crypto_account_id'
        },
        amount: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        tokenSymbol: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'token_symbol'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        txHash: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'tx_hash'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'gifts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return Gift;
};
