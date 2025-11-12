// file: src/models/answer.model.js
module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    submissionId: { type: DataTypes.UUID, allowNull: false, field: 'submission_id' },
    questionId: { type: DataTypes.UUID, allowNull: false, field: 'question_id' },
    selectedAnswer: { type: DataTypes.TEXT, field: 'selected_answer' },
    score: { type: DataTypes.DECIMAL(5, 2) },
    instructorComment: { type: DataTypes.TEXT, field: 'instructor_comment' }
  }, {
    tableName: 'answers', // CHANGED: Align with migration
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return Answer;
};