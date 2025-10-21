// file: src/services/ai.service.js
const axios = require('axios');
const FormData = require('form-data');

// Địa chỉ của AI Service Python đang chạy
const AI_SERVICE_URL = 'http://localhost:8000/analyze_frame';

const analyzeFrame = async (imageBuffer) => {
  if (!imageBuffer || imageBuffer.length === 0) {
    console.error("Lỗi: imageBuffer trống.");
    return [];
  }
  try {
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename: 'frame.jpg', contentType: 'image/jpeg' });

    const response = await axios.post(AI_SERVICE_URL, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 5000, // 5 giây
    });
    return response.data.events || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Lỗi kết nối: Không thể kết nối đến AI Service. Bạn đã chạy server Python chưa?');
    } else {
      console.error('Lỗi khi gọi AI Service:', error.message);
    }
    return [];
  }
};

module.exports = { analyzeFrame };