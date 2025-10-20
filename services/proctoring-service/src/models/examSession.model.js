// file: src/models/examSession.model.js
module.exports = (sequelize, DataTypes) => {
  const ExamSession = sequelize.define('ExamSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.BIGINT, allowNull: false, field: 'user_id' },
    examId: { type: DataTypes.STRING, allowNull: false, field: 'exam_id' },
    startTime: { type: DataTypes.DATE, allowNull: false, field: 'start_time' },
    endTime: { type: DataTypes.DATE, field: 'end_time' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'in_progress' },
    maxSeverityLevel: { type: DataTypes.STRING, field: 'max_severity_level' },
    highSeverityViolationCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'high_severity_violation_count' },
    reviewNotes: { type: DataTypes.TEXT, field: 'review_notes' },
    reviewerId: { type: DataTypes.BIGINT, field: 'reviewer_id' },
  }, {
    tableName: 'exam_sessions',
    timestamps: true, // Bật timestamps tự động cho createdAt và updatedAt
    createdAt: 'created_at', // Map createdAt của Sequelize tới cột created_at
    updatedAt: 'updated_at', // Map updatedAt của Sequelize tới cột updated_at
  });
  return ExamSession;
};