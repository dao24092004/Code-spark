// file: src/models/index.js
// Proctoring service sử dụng exam_db (đã gộp từ proctoring_db)
// exam_db: exam_sessions, proctoring_events, media_captures
// Quan hệ chuẩn từ exam-service (Java):
//   exam_sessions → proctoring_events (1:N)
//   exam_sessions → media_captures (1:N)
//   proctoring_events → media_captures (1:N) - tùy chọn

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false,
  }
);

// Import models
const ExamSession = require('./examSession.model')(sequelize, DataTypes);
const ProctoringEvent = require('./proctoringEvent.model')(sequelize, DataTypes);
const MediaCapture = require('./mediaCapture.model')(sequelize, DataTypes);

// Mối quan hệ theo exam_db schema (Java exam-service):
// 1. ExamSession → ProctoringEvent (1:N)
ExamSession.hasMany(ProctoringEvent, {
  foreignKey: 'sessionId',
  as: 'proctoringEvents'
});
ProctoringEvent.belongsTo(ExamSession, {
  foreignKey: 'sessionId',
  as: 'examSession'
});

// 2. ExamSession → MediaCapture (1:N)
ExamSession.hasMany(MediaCapture, {
  foreignKey: 'sessionId',
  as: 'mediaCaptures'
});
MediaCapture.belongsTo(ExamSession, {
  foreignKey: 'sessionId',
  as: 'examSession'
});

// 3. ProctoringEvent → MediaCapture (1:N) - tùy chọn
ProctoringEvent.hasMany(MediaCapture, {
  foreignKey: 'eventId',
  as: 'captures'
});
MediaCapture.belongsTo(ProctoringEvent, {
  foreignKey: 'eventId',
  as: 'proctoringEvent'
});

const db = {
  sequelize,
  Sequelize,
  ExamSession,
  ProctoringEvent,
  MediaCapture,
};

console.log('[PROCTORING MODELS] Loaded exam_db models:', Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize'));
module.exports = db;
