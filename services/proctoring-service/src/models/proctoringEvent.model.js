module.exports = (sequelize, DataTypes) => {
  const ProctoringEvent = sequelize.define('ProctoringEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'session_id',
    },
    eventType: {
      type: DataTypes.STRING(100), // Đổi thành 100 cho khớp Java
      allowNull: false,
      field: 'event_type',
    },
    eventData: {
      type: DataTypes.TEXT, // Đổi thành TEXT và dùng field event_data
      field: 'event_data',
    },
    timestamp: {
      type: DataTypes.DATE, // Bổ sung trường timestamp mà Java bắt buộc có
      allowNull: false,
    }
  }, {
    tableName: 'proctoring_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
  return ProctoringEvent;
};