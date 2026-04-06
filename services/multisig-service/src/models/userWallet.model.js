// file: src/models/userWallet.model.js
// crypto_db: crypto_accounts table (shared with copyright-service, token-reward-service)
// ERD: crypto_accounts(id uuid PK, profile_id uuid,
//         provider_id uuid, address UNIQUE, encrypted_private_key,
//         encryption_algorithm, key_version, encryption_iv, encryption_salt,
//         public_key, nonce, is_primary, status, linked_at, last_used_at,
//         created_at, updated_at)

module.exports = (sequelize, DataTypes) => {
    const CryptoAccount = sequelize.define(
        'CryptoAccount',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            profileId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'profile_id'
            },
            address: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            encryptedPrivateKey: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'encrypted_private_key'
            },
            encryptionAlgorithm: {
                type: DataTypes.STRING(50),
                allowNull: true,
                defaultValue: 'AES-256-GCM',
                field: 'encryption_algorithm'
            },
            keyVersion: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 1,
                field: 'key_version'
            },
            encryptionIv: {
                type: DataTypes.STRING(64),
                allowNull: true,
                field: 'encryption_iv'
            },
            encryptionSalt: {
                type: DataTypes.STRING(64),
                allowNull: true,
                field: 'encryption_salt'
            },
            publicKey: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'public_key'
            },
            nonce: {
                type: DataTypes.BIGINT,
                allowNull: true,
                defaultValue: 0,
            },
            isPrimary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: 'is_primary'
            },
            status: {
                type: DataTypes.STRING(32),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            linkedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'linked_at'
            },
            lastUsedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'last_used_at'
            },
        },
        {
            tableName: 'crypto_accounts',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return CryptoAccount;
};
