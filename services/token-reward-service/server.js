// Cấu hình môi trường
require('dotenv').config();

// Import app từ app.js
const app = require('./app');

// Khai báo PORT trước khi sử dụng
const PORT = process.env.PORT || 3001;

// Hàm khởi động server với auto-init database
async function startServer() {
    try {
        // 1. Khởi tạo database trước
        console.log('🔧 Đang kiểm tra và khởi tạo database...');
        const { initDatabase } = require('./scripts/init-database');
        await initDatabase({ closeConnection: false });
        console.log('✅ Database sẵn sàng!');

        // 2. Khởi động listener đồng bộ on-chain (không chặn server nếu lỗi)
        try {
            const depositListener = require('./src/services/depositListener');
            if (depositListener && typeof depositListener.initialize === 'function') {
                depositListener.initialize();
            }
        } catch (listenerError) {
            console.error('⚠️  Failed to initialize deposit listener:', listenerError);
        }

        // 3. Khởi động server lắng nghe trên port đã định
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Dịch vụ Token Reward đang chạy trên cổng ${PORT}`);
            console.log(`📡 Health check: http://localhost:${PORT}/health`);
            console.log(`📡 API: http://localhost:${PORT}/api/tokens`);
        });

    } catch (error) {
        console.error('❌ Lỗi khi khởi động server:', error);
        process.exit(1);
    }
}

// Chạy hàm khởi động
startServer();