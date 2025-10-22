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
    }
  }, {
    tableName: 'cm_quiz_submissions',
    timestamps: false,
  });
  return QuizSubmission;
};
