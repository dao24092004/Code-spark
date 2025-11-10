// file: src/models/index.js

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/'); // cấu hình DB

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

// Import model thủ công (KHÔNG dùng fs)
const ExamSession = require('./examSession.model')(sequelize, DataTypes);
const ProctoringEvent = require('./proctoringEvent.model')(sequelize, DataTypes);
const MediaCapture = require('./mediaCapture.model')(sequelize, DataTypes);

// Quan hệ
ExamSession.hasMany(ProctoringEvent, { foreignKey: 'sessionId', as: 'events' });
ProctoringEvent.belongsTo(ExamSession, { foreignKey: 'sessionId', as: 'session' });

ProctoringEvent.hasMany(MediaCapture, { foreignKey: 'eventId', as: 'captures' });
MediaCapture.belongsTo(ProctoringEvent, { foreignKey: 'eventId', as: 'event' });

const db = {
  sequelize,
  Sequelize,
  ExamSession,
  ProctoringEvent,
  MediaCapture,
};

console.log('[MODELS LOADED]:', Object.keys(db));
module.exports = db;