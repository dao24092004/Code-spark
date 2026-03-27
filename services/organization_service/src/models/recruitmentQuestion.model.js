// src/models/recruitmentQuestion.model.js
module.exports = (sequelize, DataTypes) => {
  const RecruitmentQuestion = sequelize.define('RecruitmentQuestion', {
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
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'question_text'
    },
    questionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'question_type'
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('options');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('options', value ? JSON.stringify(value) : null);
      }
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: 'points'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    tableName: 'recruitment_questions',
    timestamps: false // Không có created_at theo ERD
  });

  return RecruitmentQuestion;
};
