module.exports = (sequelize, DataTypes) => {
  const UserWallet = sequelize.define(
    'UserWallet',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      walletId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      lastTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      privateKey: {
        type: DataTypes.STRING(66),
        allowNull: false,
        unique: true,
      },
      label: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
    },
    {
      tableName: 'UserWallets',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'walletId'],
          name: 'user_wallet_unique'
        }
      ]
    }
  );

  return UserWallet;
};


