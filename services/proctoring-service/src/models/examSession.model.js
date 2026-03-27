// file: src/models/examSession.model.js
// exam_db: exam_sessions table — shared with exam-service (Java)
// ERD: exam_sessions(id uuid PK, organization_id uuid,
//         user_id uuid, exam_id uuid FK,
//         submission_id uuid, start_time, end_time,
//         status, grace_period_minutes, violation_threshold_count,
//         max_severity_level, high_severity_violation_count,
//         is_auto_closed, auto_fail_reason, review_notes, reviewer_id,
//         created_at, updated_at)
module.exports = (sequelize, DataTypes) => {
  const ExamSession = sequelize.define('ExamSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Organization (cross-db: organization_db)
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id'
    },
    // User ID - UUID từ identity_db (đổi từ BIGINT sang UUID)
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    // Exam ID - UUID FK đến exams table
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'exam_id'
    },
    // Submission ID - liên kết với quiz_submissions table
    submissionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'submission_id'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    // Status: ACTIVE, COMPLETED, TERMINATED, ABANDONED
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'ACTIVE'
    },
    gracePeriodMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'grace_period_minutes'
    },
    violationThresholdCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: 'violation_threshold_count'
    },
    maxSeverityLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'max_severity_level'
    },
    highSeverityViolationCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'high_severity_violation_count'
    },
    isAutoClosed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_auto_closed'
    },
    autoFailReason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'auto_fail_reason'
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_notes'
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reviewer_id'
    }
  }, {
    tableName: 'exam_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return ExamSession;
};
