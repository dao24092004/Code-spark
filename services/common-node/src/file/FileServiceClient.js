const axios = require('axios');
const FormData = require('form-data');
const AppException = require('../exception/AppException');

class FileServiceClient {
  /**
   * @param {string} fileServiceUrl - Link nội bộ của file-service (VD: http://localhost:9003/api/internal/files)
   */
  constructor(fileServiceUrl = process.env.FILE_SERVICE_URL || 'http://localhost:9003/api/internal/files') {
    this.baseUrl = fileServiceUrl;
  }

  /**
   * Upload file từ Node.js sang Java File Service
   * @param {Buffer} fileBuffer - Dữ liệu file (buffer)
   * @param {string} fileName - Tên file (VD: image.jpg)
   * @param {string} mimetype - Loại file (VD: image/jpeg)
   */
  async uploadFile(fileBuffer, fileName, mimetype) {
    try {
      // 1. Đóng gói dữ liệu chuẩn form-data giống hệt Postman
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimetype
      });

      // 2. Bắn sang Java qua mạng nội bộ
      const response = await axios.post(`${this.baseUrl}/upload`, form, {
        headers: {
          ...form.getHeaders() // Bắt buộc phải có header này của form-data
        }
      });

      // 3. Xử lý kết quả trả về từ Java (dựa theo chuẩn ApiResponse của bạn)
      if (response.data && response.data.success) {
        return response.data.data; // Trả về link Cloudinary
      } else {
        throw new AppException(response.data.message || "Lỗi khi upload file", 400);
      }

    } catch (error) {
      console.error("[FileServiceClient] Lỗi:", error.message);
      if (error instanceof AppException) throw error;
      throw new AppException("Không thể kết nối đến File Service", 500);
    }
  }
}

module.exports = FileServiceClient;