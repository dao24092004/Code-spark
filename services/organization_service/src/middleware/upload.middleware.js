// src/middleware/upload.middleware.js
const multer = require('multer');

// Cấu hình multer để lưu file vào bộ nhớ đệm (memory buffer)
// Thay vì lưu ra file tạm, chúng ta giữ nó trong RAM để xử lý ngay
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  }
});

module.exports = upload;