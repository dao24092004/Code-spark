// file: src/models/index.js
// crypto_db - dùng chung cho copyright, multisig, token-reward
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('../config/db.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Import models - align với crypto_db schema
const CryptoAccount = require('./walletAccount.model')(sequelize);
const TokenDeposit = require('./tokenDeposit.model')(sequelize);
const TokenWithdrawal = require('./tokenWithdrawal.model')(sequelize);
const Gift = require('./gift.model')(sequelize);
const User = require('./user.model')(sequelize);
const Reward = require('./reward.model')(sequelize);

// Associations
CryptoAccount.hasMany(TokenDeposit, {
    foreignKey: 'cryptoAccountId',
    as: 'tokenDeposits'
});
TokenDeposit.belongsTo(CryptoAccount, {
    foreignKey: 'cryptoAccountId',
    as: 'cryptoAccount'
});

CryptoAccount.hasMany(TokenWithdrawal, {
    foreignKey: 'cryptoAccountId',
    as: 'tokenWithdrawals'
});
TokenWithdrawal.belongsTo(CryptoAccount, {
    foreignKey: 'cryptoAccountId',
    as: 'cryptoAccount'
});

CryptoAccount.hasMany(Gift, {
    foreignKey: 'cryptoAccountId',
    as: 'gifts'
});
Gift.belongsTo(CryptoAccount, {
    foreignKey: 'cryptoAccountId',
    as: 'cryptoAccount'
});

const db = {
    sequelize,
    Sequelize,
    CryptoAccount,
    TokenDeposit,
    TokenWithdrawal,
    Gift,
    User,
    Reward,
};

module.exports = db;
