// file: src/models/multisigTransaction.model.js
// crypto_db: multisig_transactions table
// ERD: multisig_transactions(id uuid PK, wallet_id uuid,
//         tx_index_on_chain, tx_hash, destination, value,
//         data, description, status, confirmations, created_at, updated_at)

module.exports = (sequelize, DataTypes) => {
    const MultisigTransaction = sequelize.define('MultisigTransaction', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        walletId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'wallet_id'
        },
        txIndexOnChain: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'tx_index_on_chain'
        },
        txHash: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'tx_hash'
        },
        destination: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: '0x',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'SUBMITTED',
        },
        confirmations: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'multisig_transactions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    return MultisigTransaction;
};
