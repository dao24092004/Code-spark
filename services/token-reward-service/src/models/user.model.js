// src/models/user.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.BIGINT, // Dùng BIGINT để khớp với int8
            primaryKey: true,
            autoIncrement: false,
            field: 'id'
        },
        tokenBalance: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            field: 'token_balance'
        }
        // Đã xóa fullName và email khỏi đây
    }, {
        tableName: 'cm_users',
        timestamps: true // Giữ lại vì bảng có createdAt/updatedAt
    });

    return User;
};