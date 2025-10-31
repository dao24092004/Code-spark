// file: src/services/ai.service.js
const axios = require('axios');
const FormData = require('form-data');
const { Buffer } = require('buffer'); // Import Buffer

// Địa chỉ của AI Service Python đang chạy
const AI_SERVICE_URL = 'http://localhost:8000/analyze_frame';

/**
 * Phân tích khung hình bằng AI service
 * @param {string} imageBuffer - Đây là chuỗi Base64 Data URL từ client
 * @returns {Promise<Array>}
 */
const analyzeFrame = async (imageBuffer) => {
  if (!imageBuffer || imageBuffer.length === 0) {
    console.error("Lỗi: imageBuffer trống.");
    return [];
  }
  try {
    // <<< SỬA LỖI QUAN TRỌNG: CHUYỂN BASE64 VỀ BUFFER >>>

    // 1. Tách phần tiền tố "data:image/jpeg;base64," ra
    const base64String = imageBuffer.split(',')[1];
    if (!base64String) {
      console.error("Lỗi: imageBuffer không đúng định dạng Base64 Data URL.");
      return [];
    }
    
    // 2. Chuyển chuỗi Base64 thành dữ liệu nhị phân (Buffer)
    const buffer = Buffer.from(base64String, 'base64');

    // 3. Tạo FormData và gửi Buffer đi
    const formData = new FormData();
    // Gửi `buffer` (nhị phân) chứ không phải `imageBuffer` (string)
    formData.append('file', buffer, { filename: 'frame.jpg', contentType: 'image/jpeg' });

    const response = await axios.post(AI_SERVICE_URL, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 5000, // 5 giây
    });

    return response.data.events || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Lỗi kết nối: Không thể kết nối đến AI Service. Bạn đã chạy server Python chưa?');
    } else if (error.response) {
      // In ra lỗi chi tiết từ server AI
      console.error(`Lỗi khi gọi AI Service (${error.response.status}):`, error.response.data);
    } else {
      console.error('Lỗi khi gọi AI Service:', error.message);
    }
    return [];
  }
};

module.exports = { analyzeFrame };