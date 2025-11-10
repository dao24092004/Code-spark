// src/models/recruitmentQuestion.model.js
module.exports = (sequelize, DataTypes) => {
  const RecruitmentQuestion = sequelize.define('RecruitmentQuestion', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    testId: { type: DataTypes.BIGINT, allowNull: false, field: 'test_id' },
    content: { type: DataTypes.TEXT, allowNull: false },
    questionType: { type: DataTypes.STRING(50), allowNull: false, field: 'question_type' }
  }, {
    tableName: 'recruitment_questions',
    timestamps: false // Bảng này không có created_at
  });
  return RecruitmentQuestion;
};