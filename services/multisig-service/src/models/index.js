// file: src/models/index.js
// crypto_db: dùng chung cho multisig-service, copyright-service, token-reward-service

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.pass,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: 'postgres',
        logging: config.server.env === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Import models - align với crypto_db schema
const CryptoAccount = require('./userWallet.model')(sequelize, DataTypes);
const MultisigWallet = require('./multisigWallet.model')(sequelize, DataTypes);
const MultisigTransaction = require('./multisigTransaction.model')(sequelize, DataTypes);

// Associations
MultisigWallet.hasMany(MultisigTransaction, {
    foreignKey: 'walletId',
    as: 'transactions'
});
MultisigTransaction.belongsTo(MultisigWallet, {
    foreignKey: 'walletId',
    as: 'wallet'
});

CryptoAccount.hasMany(MultisigWallet, {
    foreignKey: 'cryptoAccountId',
    as: 'multisigWallets'
});
MultisigWallet.belongsTo(CryptoAccount, {
    foreignKey: 'cryptoAccountId',
    as: 'cryptoAccount'
});

const db = {
    sequelize,
    Sequelize,
    CryptoAccount,
    MultisigWallet,
    MultisigTransaction,
};

module.exports = db;
