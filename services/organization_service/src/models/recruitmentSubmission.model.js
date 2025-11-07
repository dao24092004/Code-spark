// src/models/recruitmentSubmission.model.js
module.exports = (sequelize, DataTypes) => {
  const RecruitmentSubmission = sequelize.define('RecruitmentSubmission', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    testId: { type: DataTypes.BIGINT, allowNull: false, field: 'test_id' },
    candidateId: { type: DataTypes.BIGINT, allowNull: false, field: 'candidate_id' },
    organizationId: { type: DataTypes.BIGINT, allowNull: false, field: 'organization_id' },
    score: { type: DataTypes.FLOAT, allowNull: false },
    startedAt: { type: DataTypes.DATE, field: 'started_at' },
    completedAt: { type: DataTypes.DATE, field: 'completed_at' },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'submitted' }
  }, {
    tableName: 'recruitment_submissions',
    timestamps: true,
    createdAt: 'completed_at', // Dùng completed_at làm createdAt
    updatedAt: false
  });
  return RecruitmentSubmission;
};