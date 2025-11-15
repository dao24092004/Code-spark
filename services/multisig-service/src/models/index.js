const sequelize = require('../config/database');

const DataTypes = require('sequelize').DataTypes;
const MultisigWallet = require('./multisigWallet.model')(sequelize, DataTypes);
const MultisigTransaction = require('./multisigTransaction.model')(sequelize, DataTypes);
const UserWallet = require('./userWallet.model')(sequelize, DataTypes);

// Định nghĩa associations
MultisigWallet.hasMany(MultisigTransaction, {
    foreignKey: 'walletId',
    as: 'transactions'
});

MultisigTransaction.belongsTo(MultisigWallet, {
    foreignKey: 'walletId',
    as: 'wallet'
});

MultisigWallet.hasMany(UserWallet, {
    foreignKey: 'walletId',
    as: 'ownerMappings'
});

UserWallet.belongsTo(MultisigWallet, {
    foreignKey: 'walletId',
    as: 'wallet'
});

const db = {
    sequelize,
    Sequelize: require('sequelize'),
    MultisigWallet,
    MultisigTransaction,
    UserWallet
};

module.exports = db;

