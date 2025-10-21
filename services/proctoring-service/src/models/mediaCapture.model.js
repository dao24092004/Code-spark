// file: src/models/mediaCapture.model.js
module.exports = (sequelize, DataTypes) => {
  const MediaCapture = sequelize.define('MediaCapture', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'event_id',
    },
    captureType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'capture_type',
    },
    storagePath: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: 'storage_path',
    },
  }, {
    tableName: 'media_captures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Tắt cột updatedAt nếu không cần
  });
  return MediaCapture;
};