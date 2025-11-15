const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WalletAccount = sequelize.define('WalletAccount', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            field: 'id'
        },
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'user_id'
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            field: 'address',
            set(value) {
                if (typeof value === 'string') {
                    this.setDataValue('address', value.toLowerCase());
                } else {
                    this.setDataValue('address', value);
                }
            }
        },
        status: {
            type: DataTypes.STRING(32),
            allowNull: false,
            defaultValue: 'linked',
            field: 'status'
        },
        signature: {
            type: DataTypes.TEXT,
            field: 'signature'
        },
        linkedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'linked_at'
        },
        lastSeenAt: {
            type: DataTypes.DATE,
            field: 'last_seen_at'
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
        tableName: 'cm_wallet_accounts',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    WalletAccount.associate = (models) => {
        WalletAccount.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return WalletAccount;
};

