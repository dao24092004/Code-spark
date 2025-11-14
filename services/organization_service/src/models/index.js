const { Sequelize, DataTypes } = require('sequelize');
const { 
  profileDbSequelize,
  identityDbSequelize,
  courseDbSequelize
} = require('../config/db');

// Initialize db object first
const db = {};

// Assign Sequelize and DataTypes to db
db.Sequelize = Sequelize;
db.DataTypes = DataTypes;

// === Import các model (từ các file riêng lẻ) ===

// Nhóm 1
db.Organization = require('./organization.model.js')(profileDbSequelize, DataTypes);
db.OrganizationMember = require('./organizationMember.model.js')(profileDbSequelize, DataTypes);

// Nhóm 3
db.RecruitmentTest = require('./recruitmentTest.model.js')(profileDbSequelize, DataTypes);
db.RecruitmentQuestion = require('./recruitmentQuestion.model.js')(profileDbSequelize, DataTypes);
db.RecruitmentAnswer = require('./recruitmentAnswer.model.js')(profileDbSequelize, DataTypes);
db.RecruitmentSubmission = require('./recruitmentSubmission.model.js')(profileDbSequelize, DataTypes);


// === ĐỊNH NGHĨA CÁC MỐI QUAN HỆ ===

// --- Quan hệ Nhóm 1 ---
// Organization <-> OrganizationMember
db.Organization.hasMany(db.OrganizationMember, { foreignKey: 'organizationId' });
db.OrganizationMember.belongsTo(db.Organization, { foreignKey: 'organizationId' });

// --- Quan hệ Nhóm 3 ---
// Organization <-> RecruitmentTest
db.Organization.hasMany(db.RecruitmentTest, {
  foreignKey: 'organizationId',
  as: 'recruitmentTests'
});
db.RecruitmentTest.belongsTo(db.Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Test <-> Question
// Một Test CÓ NHIỀU (hasMany) Câu hỏi
db.RecruitmentTest.hasMany(db.RecruitmentQuestion, { 
  foreignKey: 'testId',
  as: 'questions' 
});
db.RecruitmentQuestion.belongsTo(db.RecruitmentTest, { 
  foreignKey: 'testId',
  as: 'test'
});

// Question <-> Answer
// Một Câu hỏi CÓ NHIỀU (hasMany) Câu trả lời
db.RecruitmentQuestion.hasMany(db.RecruitmentAnswer, { 
  foreignKey: 'questionId',
  as: 'answers'
});
db.RecruitmentAnswer.belongsTo(db.RecruitmentQuestion, { 
  foreignKey: 'questionId',
  as: 'question'
});

// Test <-> Submission
// Một Test CÓ NHIỀU (hasMany) Lượt nộp bài
db.RecruitmentTest.hasMany(db.RecruitmentSubmission, { 
  foreignKey: 'testId',
  as: 'submissions'
});
db.RecruitmentSubmission.belongsTo(db.RecruitmentTest, { 
  foreignKey: 'testId',
  as: 'test'
});

// Organization <-> Submission
// Một Tổ chức CÓ NHIỀU (hasMany) Lượt nộp bài
db.Organization.hasMany(db.RecruitmentSubmission, {
  foreignKey: 'organizationId',
  as: 'submissions'
});
db.RecruitmentSubmission.belongsTo(db.Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});
// --- KẾT THÚC QUAN HỆ ---

module.exports = db;