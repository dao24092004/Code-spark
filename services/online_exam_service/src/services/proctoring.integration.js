// file: src/services/proctoring.integration.js

const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config'); // Import file config chung

const DEFAULT_PROCTORING_URL = 'http://127.0.0.1:8082';
let configuredProctoringUrl = config.proctoringServiceUrl || DEFAULT_PROCTORING_URL;

if (configuredProctoringUrl.includes('localhost')) {
  const ipv4Url = configuredProctoringUrl.replace('localhost', '127.0.0.1');
  console.warn(`[PROCTORING INTEGRATION] ⚠️ URL chứa 'localhost'. Sử dụng ${ipv4Url} để tránh IPv6 (::1).`);
  configuredProctoringUrl = ipv4Url;
}

const agentOptions = { family: 4 };
const httpAgent = new http.Agent(agentOptions);
const httpsAgent = new https.Agent(agentOptions);

const buildEndpoint = (path) => {
  const base = configuredProctoringUrl.replace(/\/$/, '');
  const endpoint = path.startsWith('/') ? path : `/${path}`;

  // Nếu base url đã bao gồm /api/proctoring và endpoint cũng có prefix này thì tránh lặp lại
  if (base.endsWith('/api/proctoring') && endpoint.startsWith('/api/proctoring')) {
    return `${base}${endpoint.replace('/api/proctoring', '')}`;
  }

  return `${base}${endpoint}`;
};

/**
 * Gửi yêu cầu đến proctoring-service để bắt đầu một phiên giám sát mới.
 * @param {number} userId - ID của người dùng (sinh viên).
 * @param {string} examId - ID của bài thi (quiz) đang được giám sát.
 * @param {string} authHeader - Chuỗi header Authorization (ví dụ: "Bearer eyJ...").
 * @returns {Promise<object>} - Dữ liệu của phiên giám sát được tạo ra.
 */
async function startMonitoringSession(userId, examId, authHeader) {
  try {
    // Lấy URL của proctoring-service từ file config
    const proctoringUrl = buildEndpoint('/api/proctoring/sessions/start-monitoring');

    if (!authHeader) {
      console.warn('[PROCTORING INTEGRATION] Thiếu Authorization header khi gọi startMonitoringSession. Yêu cầu có thể bị từ chối.');
    }

    console.log('[PROCTORING INTEGRATION] Bắt đầu yêu cầu tạo phiên giám sát:', {
      proctoringUrl,
      userId,
      examId,
    });

    // Gửi request POST với thông tin cần thiết
    const response = await axios.post(
      proctoringUrl,
      {
        userId: userId,
        examId: examId,
      },
      {
        httpAgent,
        httpsAgent,
        timeout: 10000,
        headers: authHeader ? { Authorization: authHeader } : undefined,
      }
    );

    return response.data; // Trả về dữ liệu session (ví dụ: { id: ..., status: ... })
  } catch (error) {
    console.error('❌ Lỗi chi tiết khi gọi đến Proctoring Service:', error);
    throw new Error('Không thể bắt đầu phiên giám sát.');
  }
}

module.exports = {
  startMonitoringSession,
}; 
