// file: src/models/multisigWallet.model.js
// crypto_db: multisig_wallets table (shared with copyright-service, token-reward-service)
// ERD: multisig_wallets(id uuid PK, crypto_account_id uuid,
//         address UNIQUE, name, description, required_confirmations,
//         total_confirmations, is_active, created_at, updated_at)

module.exports = (sequelize, DataTypes) => {
    const MultisigWallet = sequelize.define('MultisigWallet', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        cryptoAccountId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'crypto_account_id'
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        requiredConfirmations: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'required_confirmations'
        },
        totalConfirmations: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'total_confirmations'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_active'
        },
    }, {
        tableName: 'multisig_wallets',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    return MultisigWallet;
};
