// file: src/services/proctoring.integration.js

const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config'); // Import file config chung

const DEFAULT_PROCTORING_URL = 'http://127.0.0.1:8082';
let configuredProctoringUrl = config.proctoringServiceUrl || DEFAULT_PROCTORING_URL;

const resolveAuthHeader = (forwardedAuthHeader) => {
  if (forwardedAuthHeader) {
    return forwardedAuthHeader;
  }

  if (config.proctoringServiceToken) {
    const token = config.proctoringServiceToken.startsWith('Bearer ')
      ? config.proctoringServiceToken
      : `Bearer ${config.proctoringServiceToken}`;
    return token;
  }

  return undefined;
};

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
    const resolvedAuthHeader = resolveAuthHeader(authHeader);

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
        headers: resolvedAuthHeader ? { Authorization: resolvedAuthHeader } : undefined,
      }
    );

    return response.data; // Trả về dữ liệu session (ví dụ: { id: ..., status: ... })
  } catch (error) {
    console.error('❌ Lỗi chi tiết khi gọi đến Proctoring Service:', error);
    throw new Error('Không thể bắt đầu phiên giám sát.');
  }
}

async function getActiveSessions(authHeader) {
  try {
    const proctoringUrl = buildEndpoint('/api/proctoring/sessions');
    const resolvedAuthHeader = resolveAuthHeader(authHeader);

    const response = await axios.get(proctoringUrl, {
      httpAgent,
      httpsAgent,
      timeout: 10000,
      headers: resolvedAuthHeader ? { Authorization: resolvedAuthHeader } : undefined,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách phiên giám sát đang hoạt động từ Proctoring Service:', error?.message);
    if (error?.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw new Error('Không thể lấy danh sách phiên giám sát đang hoạt động.');
  }
}

async function completeMonitoringSession(sessionId, authHeader) {
  if (!sessionId) {
    console.warn('[PROCTORING INTEGRATION] Thiếu sessionId khi gọi completeMonitoringSession');
    return;
  }

  try {
    const proctoringUrl = buildEndpoint(`/api/proctoring/sessions/${sessionId}/complete`);
    const resolvedAuthHeader = resolveAuthHeader(authHeader);

    console.log('[PROCTORING INTEGRATION] Gọi complete session:', { proctoringUrl, sessionId });

    await axios.post(
      proctoringUrl,
      {},
      {
        httpAgent,
        httpsAgent,
        timeout: 10000,
        headers: resolvedAuthHeader ? { Authorization: resolvedAuthHeader } : undefined,
      }
    );
  } catch (error) {
    console.error('❌ Lỗi khi hoàn tất phiên giám sát:', error?.message || error);
    if (error?.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    // Không throw để tránh làm fail quy trình nộp bài
  }
}

module.exports = {
  startMonitoringSession,
  getActiveSessions,
  completeMonitoringSession,
};
