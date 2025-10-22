 // file: src/models/question.model.js
module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'quiz_id'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayOrder: {
        type: DataTypes.INTEGER,
        field: 'display_order'
    }
  }, {
    tableName: 'cm_questions',
    timestamps: false,
  });
  return Question;
};
