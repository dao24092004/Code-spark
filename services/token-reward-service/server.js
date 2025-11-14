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

        // Khởi động listener đồng bộ on-chain (không chặn server nếu lỗi)
        try {
            const depositListener = require('./src/services/depositListener');
            if (depositListener && typeof depositListener.initialize === 'function') {
                depositListener.initialize();
            }
        } catch (listenerError) {
            console.error('⚠️  Failed to initialize deposit listener:', listenerError);
        }

        // Khởi động server lắng nghe trên port đã định
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}.`);
        });

// Khởi động server
const PORT = process.env.PORT || 3001; // Sửa cổng mặc định thành 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dịch vụ Token Reward đang chạy trên cổng ${PORT}`);
  console.log(`Truy cập API: http://localhost:${PORT}/api/tokens/health`);
});