const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Copyright = sequelize.define('Copyright', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    ownerAddress: {
        type: DataTypes.STRING,
    },
    transactionHash: {
        type: DataTypes.STRING,
    },
}, {
    timestamps: true,
});

module.exports = Copyright;