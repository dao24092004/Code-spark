const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MultisigWallet = sequelize.define('MultisigWallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contractAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'contract_address'
  },
  owners: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  threshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      isInt: true
    }
  },
  creatorId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'creator_id'
  }
}, {
  tableName: 'multisig_wallets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MultisigWallet;

