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
// Wrap trong try-catch để tránh crash nếu models chưa tồn tại
try {
  // Kiểm tra các models cần thiết đã được load
  const requiredModels = ['Quiz', 'Question', 'ExamQuestion', 'QuestionOption', 'QuizSubmission', 'Answer', 'QuizRanking'];
  const missingModels = requiredModels.filter(modelName => !db[modelName]);
  
  if (missingModels.length > 0) {
    console.warn('⚠️ Các models sau chưa được load:', missingModels.join(', '));
    console.warn('⚠️ Mối quan hệ sẽ không được thiết lập cho các models này.');
  }

  // Mối quan hệ Many-to-Many: Quiz <-> Question qua ExamQuestion
  if (db.Quiz && db.Question && db.ExamQuestion) {
    db.Quiz.belongsToMany(db.Question, {
      through: db.ExamQuestion,
      foreignKey: 'examId',
      otherKey: 'questionId',
      as: 'questions'
    });
    db.Question.belongsToMany(db.Quiz, {
      through: db.ExamQuestion,
      foreignKey: 'questionId',
      otherKey: 'examId',
      as: 'exams'
    });

    // Mối quan hệ trực tiếp với ExamQuestion (để access displayOrder)
    db.Quiz.hasMany(db.ExamQuestion, {
      foreignKey: 'examId',
      as: 'examQuestions'
    });
    db.ExamQuestion.belongsTo(db.Quiz, {
      foreignKey: 'examId'
    });

    db.Question.hasMany(db.ExamQuestion, {
      foreignKey: 'questionId',
      as: 'examQuestions'
    });
    db.ExamQuestion.belongsTo(db.Question, {
      foreignKey: 'questionId'
    });
  }

  // Mối quan hệ: Một Question có nhiều QuestionOption
  if (db.Question && db.QuestionOption) {
    db.Question.hasMany(db.QuestionOption, {
      foreignKey: 'questionId',
      as: 'options'
    });
    db.QuestionOption.belongsTo(db.Question, {
      foreignKey: 'questionId'
    });
  }

  // Mối quan hệ: Một Quiz có nhiều QuizSubmission
  if (db.Quiz && db.QuizSubmission) {
    db.Quiz.hasMany(db.QuizSubmission, {
        foreignKey: 'quizId'
    });
    db.QuizSubmission.belongsTo(db.Quiz, {
        foreignKey: 'quizId',
        as: 'quiz' // Add alias to match service usage
    });
  }

  // Mối quan hệ: Một QuizSubmission có nhiều Answer
  if (db.QuizSubmission && db.Answer) {
    db.QuizSubmission.hasMany(db.Answer, {
      foreignKey: 'submissionId',
      as: 'answersDetail'
    });
    db.Answer.belongsTo(db.QuizSubmission, {
      foreignKey: 'submissionId'
    });
  }

  // Mối quan hệ: Một Question cũng có nhiều Answer
  if (db.Question && db.Answer) {
    db.Question.hasMany(db.Answer, {
      foreignKey: 'questionId'
    });
    db.Answer.belongsTo(db.Question, {
      foreignKey: 'questionId'
    });
  }

  // Mối quan hệ: Quiz Rankings
  if (db.Quiz && db.QuizRanking) {
    db.Quiz.hasMany(db.QuizRanking, {
      foreignKey: 'quizId'
    });
    db.QuizRanking.belongsTo(db.Quiz, {
      foreignKey: 'quizId'
    });
  }

  if (db.QuizSubmission && db.QuizRanking) {
    db.QuizSubmission.hasOne(db.QuizRanking, {
      foreignKey: 'submissionId',
      as: 'ranking'
    });
    db.QuizRanking.belongsTo(db.QuizSubmission, {
      foreignKey: 'submissionId'
    });
  }

  console.log('✅ Đã thiết lập mối quan hệ giữa các models.');
} catch (error) {
  console.error('❌ Lỗi khi thiết lập mối quan hệ giữa các models:', error.message);
  console.error('Stack trace:', error.stack);
}
// ---------------------------------------------------

module.exports = db;