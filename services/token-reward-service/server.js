// Cấu hình môi trường
require('dotenv').config();

// Import app từ app.js
const app = require('./app');

// Khai báo PORT trước khi sử dụng
const PORT = process.env.PORT || 3001;

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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Dịch vụ Token Reward đang chạy trên cổng ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 API: http://localhost:${PORT}/api/tokens`);
});