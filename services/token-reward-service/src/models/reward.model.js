// src/models/reward.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Reward = sequelize.define('Reward', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            field: 'id' 
        },
        studentId: {
            type: DataTypes.INTEGER, // Đổi thành BIGINT/int8 nếu studentId của bạn là int8
            allowNull: false,
            field: 'student_id'
        },
        tokensAwarded: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'tokens_awarded'
        },
        reasonCode: {
            type: DataTypes.STRING,
            field: 'reason_code'
        },
        relatedId: {
            type: DataTypes.UUID,
            field: 'related_id'
        },
        awardedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'awarded_at'
        },
        // *** DÒNG QUAN TRỌNG ĐƯỢC THÊM VÀO ***
        transaction_type: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'EARN'
        }
    }, {
        tableName: 'cm_rewards', 
        timestamps: false 
    });

    return Reward;
};