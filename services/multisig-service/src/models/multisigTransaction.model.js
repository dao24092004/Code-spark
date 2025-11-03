const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MultisigTransaction = sequelize.define('MultisigTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  walletId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'multisig_wallets',
      key: 'id'
    },
    field: 'wallet_id'
  },
  txIndexOnChain: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tx_index_on_chain'
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'tx_hash'
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING, // Lưu dạng string để tránh overflow với số lớn
    allowNull: false
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '0x'
  },
  status: {
    type: DataTypes.ENUM('submitted', 'confirmed', 'executed', 'failed'),
    allowNull: false,
    defaultValue: 'submitted'
  },
  confirmations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'multisig_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MultisigTransaction;

