require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const port = parseInt(process.env.PORT, 10) || 3002;

module.exports = {
  env,
  port,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS, 10) || 2048
  },
  services: {
    // URL gọi sang Java Service (chú ý port 8080 hoặc 8082 tùy cấu hình Java của bạn)
    courseServiceUrl: process.env.COURSE_SERVICE_URL || 'http://localhost:8080/api/v1/courses/internal/all-metadata'
  }
};