module.exports = (sequelize, DataTypes) => {
  const UserWallet = sequelize.define(
    'UserWallet',
    {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
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
    }
  );

  return UserWallet;
};


