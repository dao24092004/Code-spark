// src/models/organization.model.js

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    id: { 
      type: DataTypes.BIGINT, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'short_description'
    },
    logo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Việt Nam'
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'postal_code'
    },
    ownerId: { 
      type: DataTypes.BIGINT, 
      allowNull: false, 
      field: 'owner_id' 
    },
    imageUrl: { 
      type: DataTypes.TEXT, 
      field: 'image_url' 
    },
    orgType: { 
      type: DataTypes.STRING(100), 
      field: 'org_type' 
    },
    orgSize: { 
      type: DataTypes.STRING(100), 
      field: 'org_size' 
    },
    industry: { 
      type: DataTypes.STRING(100) 
    },
    foundedYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'founded_year'
    },
    revenue: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'VND'
    },
    employees: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    departments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    package: { 
      type: DataTypes.STRING(100) 
    },
    subscriptionPlan: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'free',
      field: 'subscription_plan'
    },
    subscriptionStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'active',
      field: 'subscription_status'
    },
    subscriptionExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'subscription_expiry'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('tags');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      }
    },
    contactPerson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'contact_person',
      get() {
        const rawValue = this.getDataValue('contactPerson');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('contactPerson', JSON.stringify(value || null));
      }
    },
    socialMedia: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'social_media',
      get() {
        const rawValue = this.getDataValue('socialMedia');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('socialMedia', JSON.stringify(value || {}));
      }
    },
    settings: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('settings');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('settings', JSON.stringify(value || null));
      }
    },
    status: { 
      type: DataTypes.STRING(50), 
      allowNull: false, 
      defaultValue: 'active' 
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    isVerified: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: false, 
      field: 'is_verified' 
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_premium'
    },
    verificationStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'not_verified',
      field: 'verification_status'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    }
  }, {
    tableName: 'organizations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Organization;
};