const sequelize = require('../config/database');

const MultisigWallet = require('./multisigWallet.model')(sequelize, require('sequelize').DataTypes);
const MultisigTransaction = require('./multisigTransaction.model')(sequelize, require('sequelize').DataTypes);

// Định nghĩa associations
MultisigWallet.hasMany(MultisigTransaction, {
    foreignKey: 'walletId',
    as: 'transactions'
});

MultisigTransaction.belongsTo(MultisigWallet, {
    foreignKey: 'walletId',
    as: 'wallet'
});

const db = {
    sequelize,
    Sequelize: require('sequelize'),
    MultisigWallet,
    MultisigTransaction
};

module.exports = db;

