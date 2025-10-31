// file: src/models/index.js

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/');
const fs = require('fs');
const path = require('path');

// 1. Khởi tạo kết nối Sequelize từ file config
const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: false,
  }
);

const db = {};

// 2. Tự động đọc tất cả các file model trong thư mục hiện tại
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// 3. Thiết lập mối quan hệ (nếu model có hàm associate)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// --- BỔ SUNG PHẦN ĐỊNH NGHĨA MỐI QUAN HỆ ---

// Mối quan hệ: Một Quiz có nhiều Question
db.Quiz.hasMany(db.Question, {
  foreignKey: 'quizId', // Tên thuộc tính trong Question model
  as: 'questions'       // Bí danh khi truy vấn (quan trọng cho lệnh include)
});
db.Question.belongsTo(db.Quiz, {
  foreignKey: 'quizId'
});

// Mối quan hệ: Một Question có nhiều QuestionOption
db.Question.hasMany(db.QuestionOption, {
  foreignKey: 'questionId',
  as: 'options'
});
db.QuestionOption.belongsTo(db.Question, {
  foreignKey: 'questionId'
});

// Mối quan hệ: Một Quiz có nhiều QuizSubmission
db.Quiz.hasMany(db.QuizSubmission, {
    foreignKey: 'quizId'
});
db.QuizSubmission.belongsTo(db.Quiz, {
    foreignKey: 'quizId'
});
// Mối quan hệ: Một QuizSubmission có nhiều Answer
db.QuizSubmission.hasMany(db.Answer, {
  foreignKey: 'submissionId',
  as: 'answersDetail'
});
db.Answer.belongsTo(db.QuizSubmission, {
  foreignKey: 'submissionId'
});

// Mối quan hệ: Một Question cũng có nhiều Answer
db.Question.hasMany(db.Answer, {
  foreignKey: 'questionId'
});
db.Answer.belongsTo(db.Question, {
  foreignKey: 'questionId'
});
// ---------------------------------------------------

module.exports = db;