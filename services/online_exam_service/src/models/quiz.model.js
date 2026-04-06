// file: src/models/quiz.model.js
// exam_db: exams table — shared with exam-service (Java)
// ERD: exams(id uuid, course_id uuid FK, org_id uuid, title, description,
//        start_at, end_at, duration_minutes, pass_score, max_attempts,
//        created_by uuid, status, randomize_question_order, randomize_option_order,
//        show_correct_answers, partial_scoring_enabled, created_at)
module.exports = (sequelize, DataTypes) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Organization (ERD: cross-db reference to organization_db)
    orgId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'org_id'
    },
    // FK to course-service cm_courses
    courseId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'course_id'
    },
    title: {
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      defaultValue: 'DRAFT',
    },
    // exam_db extras (Java entity columns not in ERD)
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
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at'
    }
  }, {
    tableName: 'exams',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return Quiz;
};
