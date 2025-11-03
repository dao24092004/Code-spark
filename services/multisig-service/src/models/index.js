const sequelize = require('../config/db');
const MultisigWallet = require('./multisigWallet.model');
const MultisigTransaction = require('./multisigTransaction.model');

// Define associations
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
  MultisigWallet,
  MultisigTransaction
};

module.exports = db;

