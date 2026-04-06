// ERD: token_withdrawals(id uuid PK, profile_id uuid,
//         crypto_account_id uuid, to_address, amount bigint, token_symbol,
//         status, tx_hash, processed_at, created_at) — KHÔNG có updated_at

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TokenWithdrawal = sequelize.define('TokenWithdrawal', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            field: 'id'
        },
        profileId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'profile_id'
        },
        cryptoAccountId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'crypto_account_id'
        },
        toAddress: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'to_address'
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
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'processed_at'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'token_withdrawals',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return TokenWithdrawal;
};
