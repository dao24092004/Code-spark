require('dotenv').config({ path: '../.env' });

const config = {
  // Cấu hình server
  port: process.env.PORT || 8008,
  env: process.env.NODE_ENV || 'development',

  // Cấu hình kết nối DB 1 (Profile DB) - CHỈ CHO PROFILES
  profileDb: {
    host: process.env.PROFILE_DB_HOST,
    port: process.env.PROFILE_DB_PORT,
    username: process.env.PROFILE_DB_USER,
    password: process.env.PROFILE_DB_PASSWORD,
    database: process.env.PROFILE_DB_NAME,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },

  // Cấu hình kết nối DB Organization (cho organizations, members, recruitment)
  organizationDb: {
    host: process.env.ORGANIZATION_DB_HOST || process.env.PROFILE_DB_HOST,
    port: process.env.ORGANIZATION_DB_PORT || process.env.PROFILE_DB_PORT,
    username: process.env.ORGANIZATION_DB_USER || process.env.PROFILE_DB_USER,
    password: process.env.ORGANIZATION_DB_PASSWORD || process.env.PROFILE_DB_PASSWORD,
    database: process.env.ORGANIZATION_DB_NAME || 'organization_db',
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },

  // Cấu hình kết nối DB 2 (Identity DB)
  identityDb: {
    host: process.env.IDENTITY_DB_HOST,
    port: process.env.IDENTITY_DB_PORT,
    username: process.env.IDENTITY_DB_USER,
    password: process.env.IDENTITY_DB_PASSWORD,
    database: process.env.IDENTITY_DB_NAME,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },

  // Cấu hình kết nối DB 3 (Course DB)
  courseDb: {
    host: process.env.COURSE_DB_HOST,
    port: process.env.COURSE_DB_PORT,
    username: process.env.COURSE_DB_USER,
    password: process.env.COURSE_DB_PASSWORD,
    database: process.env.COURSE_DB_NAME,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },

  // Cấu hình API Gateway
  gateway: {
    enabled: process.env.API_GATEWAY_ENABLED !== 'false', // Mặc định là true
    baseUrl: process.env.API_GATEWAY_BASE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.API_GATEWAY_TIMEOUT, 10) || 30000,
    retries: parseInt(process.env.API_GATEWAY_RETRIES, 10) || 3,
  },

  // Cấu hình bảo mật
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'code-spark',
      audience: process.env.JWT_AUDIENCE || 'code-spark-users'
    },
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS, 10) || 10
  },

  // Cấu hình logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  }
};

module.exports = config;