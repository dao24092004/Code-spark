 // file: src/models/quizSubmission.model.js
module.exports = (sequelize, DataTypes) => {
  const QuizSubmission = sequelize.define('QuizSubmission', {
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
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'student_id'
    },
    score: {
      type: DataTypes.INTEGER,
    },
    submittedAt: {
      type: DataTypes.DATE,
      field: 'submitted_at'
    },
    answers: {
      type: DataTypes.TEXT,
    },
    // New tracking fields
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at'
    },
    timeSpentSeconds: {
      type: DataTypes.INTEGER,
      field: 'time_spent_seconds'
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      field: 'correct_answers'
    },
    wrongAnswers: {
      type: DataTypes.INTEGER,
      field: 'wrong_answers'
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      field: 'total_questions'
    }
  }, {
    tableName: 'quiz_submissions', // CHANGED: Align with migration
    timestamps: false,
  });
  return QuizSubmission;
};
