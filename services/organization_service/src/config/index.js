// Nạp biến môi trường từ file .env ở thư mục gốc
require('dotenv').config({ path: '../../.env' });

const config = {
  // Cấu hình server
  port: process.env.PORT || 8008,

  // Cấu hình kết nối DB 1 (Profile DB)
  profileDb: {
    host: process.env.PROFILE_DB_HOST,
    port: process.env.PROFILE_DB_PORT,
    username: process.env.PROFILE_DB_USER,
    password: process.env.PROFILE_DB_PASSWORD,
    database: process.env.PROFILE_DB_NAME,
    dialect: 'postgres' // Vì chúng ta dùng PostgreSQL
  },

  // Cấu hình kết nối DB 2 (Identity DB)
  identityDb: {
    host: process.env.IDENTITY_DB_HOST,
    port: process.env.IDENTITY_DB_PORT,
    username: process.env.IDENTITY_DB_USER,
    password: process.env.IDENTITY_DB_PASSWORD,
    database: process.env.IDENTITY_DB_NAME,
    dialect: 'postgres'
  },

  // Cấu hình kết nối DB 3 (Course DB)
  courseDb: {
    host: process.env.COURSE_DB_HOST,
    port: process.env.COURSE_DB_PORT,
    username: process.env.COURSE_DB_USER,
    password: process.env.COURSE_DB_PASSWORD,
    database: process.env.COURSE_DB_NAME,
    dialect: 'postgres'
  },

  // Cấu hình bảo mật (Giống file mẫu của bạn)
  security: {
    jwt: {
      secret: process.env.JWT_SECRET
    }
  }
};

module.exports = config;