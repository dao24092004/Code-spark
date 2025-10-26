// file: src/services/proctoring.integration.js

const axios = require('axios');
const config = require('../config'); // Import file config chung

/**
 * Gửi yêu cầu đến proctoring-service để bắt đầu một phiên giám sát mới.
 * @param {number} userId - ID của người dùng (sinh viên).
 * @param {string} submissionId - ID của bài làm (kiểu UUID).
 * @returns {Promise<object>} - Dữ liệu của phiên giám sát được tạo ra.
 */
async function startMonitoringSession(userId, submissionId) {
  try {
    // Lấy URL của proctoring-service từ file config
    const proctoringUrl = `${config.proctoringServiceUrl}/api/sessions/start-monitoring`;

    console.log(`[Integration] Gọi đến Proctoring Service tại: ${proctoringUrl}`);

    // Gửi request POST với thông tin cần thiết
    const response = await axios.post(proctoringUrl, {
      userId: userId,
      examId: submissionId, // Gửi submissionId để proctoring-service biết giám sát cho bài làm nào
    });

    console.log('[Integration] Proctoring Service đã xác nhận bắt đầu giám sát.');
    return response.data; // Trả về dữ liệu session (ví dụ: { id: ..., status: ... })

  } catch (error) {
    console.error('❌ Lỗi chi tiết khi gọi đến Proctoring Service:', error); 
     throw new Error('Không thể bắt đầu phiên giám sát.');
  }
}

module.exports = {
  startMonitoringSession,
}; 
