module.exports = (sequelize, DataTypes) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // FK kết nối sang course_db (Service khác)
    courseId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'course_id'
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    startAt: {
      type: DataTypes.DATE,
      field: 'start_at'
    },
    endAt: {
      type: DataTypes.DATE,
      field: 'end_at'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      field: 'duration_minutes'
    },
    passScore: {
      type: DataTypes.INTEGER,
      field: 'pass_score'
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      field: 'max_attempts'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'DRAFT',
    },
    examType: {
      type: DataTypes.STRING,
      field: 'exam_type'
    },
    difficulty: {
      type: DataTypes.INTEGER,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      field: 'total_questions'
    },
    // Các trường Boolean khớp với cấu trúc bảng exams bạn gửi
    randomizeQuestionOrder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'randomize_question_order'
    },
    randomizeOptionOrder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'randomize_option_order'
    },
    showCorrectAnswers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'show_correct_answers'
    },
    partialScoringEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'partial_scoring_enabled'
    },
    // Timestamps
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'exams', // Chắc chắn bảng này nằm trong exam_db
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Nếu bạn dùng deleted_at để xóa mềm
  });

  return Quiz;
};