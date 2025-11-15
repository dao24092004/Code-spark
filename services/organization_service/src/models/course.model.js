module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: { 
      type: DataTypes.BIGINT, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    description: DataTypes.TEXT,
    organization_id: { 
      type: DataTypes.BIGINT, 
      allowNull: false
    },
    status: { 
      type: DataTypes.ENUM('draft', 'published', 'archived'), 
      defaultValue: 'draft' 
    }
  }, {
    tableName: 'courses',
    timestamps: true,
    underscored: true
  });

  return Course;
};