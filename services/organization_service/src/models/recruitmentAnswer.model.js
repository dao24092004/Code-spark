// src/models/recruitmentAnswer.model.js
module.exports = (sequelize, DataTypes) => {
  const RecruitmentAnswer = sequelize.define('RecruitmentAnswer', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    questionId: { type: DataTypes.BIGINT, allowNull: false, field: 'question_id' },
    content: { type: DataTypes.TEXT, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, field: 'is_correct' }
  }, {
    tableName: 'recruitment_answers',
    timestamps: false // Bảng này không có created_at
  });
  return RecruitmentAnswer;
};