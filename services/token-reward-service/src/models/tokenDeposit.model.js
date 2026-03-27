// ERD: token_deposits(id uuid PK, profile_id uuid,
//         crypto_account_id uuid, tx_hash, from_address, amount bigint,
//         token_symbol, status, block_number, confirmations,
//         processed_at, created_at) — KHÔNG có updated_at

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TokenDeposit = sequelize.define('TokenDeposit', {
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
        txHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'tx_hash'
        },
        fromAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'from_address'
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
        blockNumber: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'block_number'
        },
        confirmations: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
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
        tableName: 'token_deposits',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return TokenDeposit;
};
