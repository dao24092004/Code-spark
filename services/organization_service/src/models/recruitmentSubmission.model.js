// src/models/recruitmentSubmission.model.js
module.exports = (sequelize, DataTypes) => {
  const RecruitmentSubmission = sequelize.define('RecruitmentSubmission', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    testId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'test_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    answers: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('answers');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('answers', value ? JSON.stringify(value) : null);
      }
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at'
    }
  }, {
    tableName: 'recruitment_submissions',
    timestamps: true,
    createdAt: 'submitted_at',
    updatedAt: false // Chỉ có submitted_at theo ERD
  });

  return RecruitmentSubmission;
};
