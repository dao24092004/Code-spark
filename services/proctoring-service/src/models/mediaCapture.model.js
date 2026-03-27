// file: src/models/mediaCapture.model.js
// exam_db: media_captures table — shared with exam-service (Java)
// ERD: media_captures(id uuid PK, session_id uuid FK,
//         capture_type, storage_path, created_at)
module.exports = (sequelize, DataTypes) => {
  const MediaCapture = sequelize.define('MediaCapture', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Session ID - UUID FK đến exam_sessions table (NOT event_id như code cũ)
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'session_id',
    },
    // Event ID - Optional link to proctoring_events (nullable)
    eventId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'event_id',
    },
    // Capture type: screenshot, webcam
    captureType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'capture_type',
    },
    // Storage path for the captured media
    storagePath: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: 'storage_path',
    },
  }, {
    tableName: 'media_captures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
  return MediaCapture;
};
