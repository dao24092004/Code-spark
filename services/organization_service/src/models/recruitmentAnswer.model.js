// src/models/recruitmentAnswer.model.js
module.exports = (sequelize, DataTypes) => {
  const RecruitmentAnswer = sequelize.define('RecruitmentAnswer', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'question_id'
    },
    answerText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'answer_text'
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_correct'
    }
  }, {
    tableName: 'recruitment_answers',
    timestamps: false // Không có created_at theo ERD
  });

  return RecruitmentAnswer;
};
