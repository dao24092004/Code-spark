// file: src/models/quiz.model.js
module.exports = (sequelize, DataTypes) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'course_id'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      field: 'time_limit_minutes'
    }
  }, {
    tableName: 'cm_quizzes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
  return Quiz;
};