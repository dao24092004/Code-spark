// file: src/models/examQuestion.model.js
// Join table linking exams with questions
module.exports = (sequelize, DataTypes) => {
  const ExamQuestion = sequelize.define('ExamQuestion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'exam_id'
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'question_id'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'exam_questions',
    timestamps: false,
  });
  return ExamQuestion;
};

