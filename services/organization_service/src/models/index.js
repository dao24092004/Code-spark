const { Sequelize, DataTypes } = require('sequelize');
const {
  profileDbSequelize,
  organizationDbSequelize,
  identityDbSequelize,
  courseDbSequelize
} = require('../config/db');

// Initialize db object first
const db = {};

// Assign Sequelize and DataTypes to db
db.Sequelize = Sequelize;
db.DataTypes = DataTypes;

// Export sequelize instance
db.sequelize = organizationDbSequelize;

// === Import các model ===

// Nhóm Organization
db.Organization = require('./organization.model.js')(organizationDbSequelize, DataTypes);
db.OrganizationMember = require('./organizationMember.model.js')(organizationDbSequelize, DataTypes);
db.OrganizationInvitation = require('./organizationInvitation.model.js')(organizationDbSequelize, DataTypes);

// Nhóm Recruitment
db.RecruitmentTest = require('./recruitmentTest.model.js')(organizationDbSequelize, DataTypes);
db.RecruitmentQuestion = require('./recruitmentQuestion.model.js')(organizationDbSequelize, DataTypes);
db.RecruitmentAnswer = require('./recruitmentAnswer.model.js')(organizationDbSequelize, DataTypes);
db.RecruitmentSubmission = require('./recruitmentSubmission.model.js')(organizationDbSequelize, DataTypes);

// === ĐỊNH NGHĨA CÁC MỐI QUAN HỆ ===

// --- Organization relationships ---
db.Organization.hasMany(db.OrganizationMember, {
  foreignKey: 'organizationId',
  as: 'members'
});
db.OrganizationMember.belongsTo(db.Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

db.Organization.hasMany(db.OrganizationInvitation, {
  foreignKey: 'organizationId',
  as: 'invitations'
});
db.OrganizationInvitation.belongsTo(db.Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// --- Recruitment relationships ---
db.Organization.hasMany(db.RecruitmentTest, {
  foreignKey: 'organizationId',
  as: 'recruitmentTests'
});
db.RecruitmentTest.belongsTo(db.Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

db.RecruitmentTest.hasMany(db.RecruitmentQuestion, {
  foreignKey: 'testId',
  as: 'questions'
});
db.RecruitmentQuestion.belongsTo(db.RecruitmentTest, {
  foreignKey: 'testId',
  as: 'test'
});

db.RecruitmentQuestion.hasMany(db.RecruitmentAnswer, {
  foreignKey: 'questionId',
  as: 'answers'
});
db.RecruitmentAnswer.belongsTo(db.RecruitmentQuestion, {
  foreignKey: 'questionId',
  as: 'question'
});

db.RecruitmentTest.hasMany(db.RecruitmentSubmission, {
  foreignKey: 'testId',
  as: 'submissions'
});
db.RecruitmentSubmission.belongsTo(db.RecruitmentTest, {
  foreignKey: 'testId',
  as: 'test'
});

module.exports = db;
