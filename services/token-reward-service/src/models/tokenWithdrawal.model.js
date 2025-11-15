const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TokenWithdrawal = sequelize.define('TokenWithdrawal', {
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
            allowNull: false,
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
        amount: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'amount'
        },
        tokenAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'token_address'
        },
        txHash: {
            type: DataTypes.STRING(80),
            allowNull: true,
            field: 'tx_hash'
        },
        escrowRequestId: {
            type: DataTypes.STRING(80),
            allowNull: true,
            field: 'escrow_request_id'
        },
        status: {
            type: DataTypes.STRING(32),
            allowNull: false,
            defaultValue: 'requested',
            field: 'status'
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: 'metadata'
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
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'completed_at'
        }
    }, {
        tableName: 'cm_token_withdrawals',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    TokenWithdrawal.associate = (models) => {
        TokenWithdrawal.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        TokenWithdrawal.belongsTo(models.WalletAccount, {
            foreignKey: 'walletAddress',
            targetKey: 'address',
            as: 'wallet'
        });
    };

    return TokenWithdrawal;
};

