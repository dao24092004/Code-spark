// file: src/models/proctoringEvent.model.js
module.exports = (sequelize, DataTypes) => {
  const ProctoringEvent = sequelize.define('ProctoringEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Ánh xạ sessionId (code) tới session_id (DB)
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'session_id', 
    },
    eventType: {
      type: DataTypes.STRING, // Sequelize không có kiểu ENUM gốc, dùng STRING
      allowNull: false,
      field: 'event_type',
    },
    severity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSONB,
    },
    isReviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_reviewed',
    },
  }, {
    tableName: 'proctoring_events', // Chỉ định rõ tên bảng
    timestamps: false, // Tắt timestamps tự động vì đã có cột timestamp riêng
  });
  return ProctoringEvent;
};