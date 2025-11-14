// Cấu hình môi trường
require('dotenv').config();
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Định tuyến
const router = express.Router();

// API kiểm tra hoạt động
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'token-reward-service',
    port: process.env.PORT || 3001
  });
});

// Sử dụng router với tiền tố /api/tokens
app.use('/api/tokens', router);

// Khởi động server
const PORT = process.env.PORT || 3001; // Sửa cổng mặc định thành 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dịch vụ Token Reward đang chạy trên cổng ${PORT}`);
  console.log(`Truy cập API: http://localhost:${PORT}/api/tokens/health`);
});