const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TokenDeposit = sequelize.define('TokenDeposit', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            field: 'id'
        },
        userId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'user_id'
        },
        walletAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'wallet_address',
            set(value) {
                if (typeof value === 'string') {
                    this.setDataValue('walletAddress', value.toLowerCase());
                } else {
                    this.setDataValue('walletAddress', value);
                }
            },
            get() {
                const value = this.getDataValue('walletAddress');
                return value ? value.toLowerCase() : value;
            }
        },
        txHash: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
            field: 'tx_hash'
        },
        tokenAddress: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'token_address'
        },
        fromAddress: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'from_address'
        },
        toAddress: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'to_address'
        },
        amountRaw: {
            type: DataTypes.DECIMAL(78, 0),
            allowNull: false,
            field: 'amount_raw'
        },
        amountTokens: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'amount_tokens'
        },
        blockNumber: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'block_number'
        },
        blockTimestamp: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'block_timestamp'
        },
        status: {
            type: DataTypes.STRING(32),
            allowNull: false,
            defaultValue: 'pending',
            field: 'status'
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: 'metadata'
        },
        confirmedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'confirmed_at'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        }
    }, {
        tableName: 'cm_token_deposits',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    TokenDeposit.associate = (models) => {
        TokenDeposit.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        TokenDeposit.belongsTo(models.WalletAccount, {
            foreignKey: 'walletAddress',
            targetKey: 'address',
            as: 'wallet'
        });
    };

    return TokenDeposit;
};

