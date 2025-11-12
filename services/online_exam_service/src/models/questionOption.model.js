// file: src/models/questionOption.model.js

module.exports = (sequelize, DataTypes) => {
  const QuestionOption = sequelize.define('QuestionOption', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'question_id' // Map với cột trong DB
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_correct' // Map với cột trong DB
    }
  }, {
    tableName: 'question_options', // CHANGED: Align with migration
    timestamps: false,
  });

  return QuestionOption;
};