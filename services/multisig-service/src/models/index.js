const config = require('../config');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(config.database.name, config.database.user, config.database.pass, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: false, // Tắt log SQL
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Tải các models
db.MultisigWallet = require('./multisigWallet.model.js')(sequelize, Sequelize);
db.MultisigTransaction = require('./multisigTransaction.model.js')(sequelize, Sequelize);

// Định nghĩa quan hệ
db.MultisigWallet.hasMany(db.MultisigTransaction, { 
    foreignKey: 'walletId',
    as: 'transactions' 
});
db.MultisigTransaction.belongsTo(db.MultisigWallet, {
    foreignKey: 'walletId',
    as: 'wallet'
});

module.exports = db;