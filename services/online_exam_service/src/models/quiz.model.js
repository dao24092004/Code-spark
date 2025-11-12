// file: src/models/quiz.model.js
module.exports = (sequelize, DataTypes) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Map to exam-service fields
    orgId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'org_id' // Maps to Exam.orgId
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    // Exam-service fields
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
      field: 'duration_minutes' // Maps to Exam.durationMinutes
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
      validate: {
        isIn: [['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']]
      }
    }
  }, {
    tableName: 'exams', // SHARED with exam-service
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });
  return Quiz;
};