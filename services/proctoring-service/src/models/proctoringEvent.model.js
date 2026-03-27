// file: src/models/proctoringEvent.model.js
// exam_db: proctoring_events table — shared with exam-service (Java)
// ERD: proctoring_events(id uuid PK, session_id uuid FK,
//         event_type, severity, metadata jsonb, is_reviewed,
//         created_at)
module.exports = (sequelize, DataTypes) => {
  const ProctoringEvent = sequelize.define('ProctoringEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Session ID - UUID FK đến exam_sessions table
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'session_id',
    },
    // Event type: TAB_SWITCH, FACE_ABSENT, MULTIPLE_FACES, SCREEN_SHARE, etc.
    eventType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'event_type',
    },
    // Severity: LOW, MEDIUM, HIGH, CRITICAL
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    // Metadata JSONB for additional event data
    metadata: {
      type: DataTypes.JSONB,
    },
    // Flag to mark if event has been reviewed by admin
    isReviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_reviewed',
    },
  }, {
    tableName: 'proctoring_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
  return ProctoringEvent;
};
