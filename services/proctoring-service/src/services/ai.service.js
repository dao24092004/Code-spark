// file: src/services/ai.service.js
const axios = require('axios');
const FormData = require('form-data');
const { Buffer } = require('buffer');
const http = require('http');
const https = require('https');
const config = require('../config');

const DEFAULT_AI_URL = 'http://127.0.0.1:8000/analyze_frame';
let configuredAiUrl = config.ai?.url || DEFAULT_AI_URL;

if (configuredAiUrl.includes('localhost')) {
  const ipv4Url = configuredAiUrl.replace('localhost', '127.0.0.1');
  console.warn(`[AI SERVICE] ⚠️ URL chứa 'localhost'. Sử dụng ${ipv4Url} để tránh IPv6 (::1).`);
  configuredAiUrl = ipv4Url;
}

const agentOptions = { family: 4 };
const httpAgent = new http.Agent(agentOptions);
const httpsAgent = new https.Agent(agentOptions);

// Địa chỉ của AI Service Python đang chạy (từ env hoặc default)
const AI_SERVICE_URL = configuredAiUrl;

// Log để debug
console.log(`[AI SERVICE] URL được cấu hình: ${AI_SERVICE_URL}`);

/**
 * Phân tích khung hình bằng AI service
 * @param {string} imageBuffer - Đây là chuỗi Base64 Data URL từ client
 * @returns {Promise<Array>}
 */
const analyzeFrame = async (imageBuffer) => {
  if (!imageBuffer || imageBuffer.length === 0) {
    console.error('Lỗi: imageBuffer trống.');
    return [];
  }

  try {
    // <<< SỬA LỖI QUAN TRỌNG: CHUYỂN BASE64 VỀ BUFFER >>>

    // 1. Tách phần tiền tố "data:image/jpeg;base64," ra
    const base64String = imageBuffer.split(',')[1];
    if (!base64String) {
      console.error('Lỗi: imageBuffer không đúng định dạng Base64 Data URL.');
      return [];
    }

    // 2. Chuyển chuỗi Base64 thành dữ liệu nhị phân (Buffer)
    const buffer = Buffer.from(base64String, 'base64');

    // 3. Tạo FormData và gửi Buffer đi
    const formData = new FormData();
    // Gửi `buffer` (nhị phân) chứ không phải `imageBuffer` (string)
    formData.append('file', buffer, { filename: 'frame.jpg', contentType: 'image/jpeg' });

    console.log(`[AI SERVICE] 🚀 Đang gửi request đến: ${AI_SERVICE_URL}`);
    console.log(`[AI SERVICE] 📦 Buffer size: ${buffer.length} bytes`);

    const response = await axios.post(AI_SERVICE_URL, formData, {
      headers: { ...formData.getHeaders() },
      timeout: config.ai?.timeout || 30000, // Configurable timeout (default 30s - AI service takes ~19-20s)
      httpAgent,
      httpsAgent,
    });

    console.log(`[AI SERVICE] ✅ Nhận được response từ AI Service:`, response.status);
    return response.data.events || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`[AI SERVICE] ❌ Không thể kết nối đến AI Service tại ${AI_SERVICE_URL}`);
      console.error(`[AI SERVICE]    Message: ${error.message}`);
      console.error(`[AI SERVICE] ⚠️  Đảm bảo Python server đang chạy (uvicorn main:app --host 0.0.0.0 --port 8000 --reload).`);
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      const timeoutSeconds = (config.ai?.timeout || 30000) / 1000;
      console.error(`[AI SERVICE] ⏱️  Timeout khi gọi AI Service (quá ${timeoutSeconds} giây)`);
    } else if (error.response) {
      // In ra lỗi chi tiết từ server AI
      console.error(`[AI SERVICE] ❌ Lỗi từ AI Service (${error.response.status}):`, error.response.data);
    } else {
      console.error(`[AI SERVICE] ❌ Lỗi khi gọi AI Service:`, error.message);
      console.error(`[AI SERVICE]    Error code: ${error.code || 'N/A'}`);
    }
    return [];
  }
};

module.exports = { analyzeFrame };