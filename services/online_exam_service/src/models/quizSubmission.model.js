// file: src/models/quizSubmission.model.js
module.exports = (sequelize, DataTypes) => {
  const QuizSubmission = sequelize.define('QuizSubmission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id'
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
    },
    isFinal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_final'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    }
  }, {
    tableName: 'quiz_submissions',
    timestamps: false,
  });
  return QuizSubmission;
};
