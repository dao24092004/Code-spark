// file: src/models/quizRanking.model.js
module.exports = (sequelize, DataTypes) => {
  const QuizRanking = sequelize.define('QuizRanking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'quiz_id'
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'student_id'
    },
    submissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'submission_id'
    },
    percentile: {
      type: DataTypes.DECIMAL(5, 2),
    },
    rank: {
      type: DataTypes.INTEGER,
    },
    totalSubmissions: {
      type: DataTypes.INTEGER,
      field: 'total_submissions'
    }
  }, {
    tableName: 'quiz_rankings',
    timestamps: false,
  });
  return QuizRanking;
};
