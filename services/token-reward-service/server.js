// server.js
require('dotenv').config();

// Import app từ file app.js
const app = require('./app'); 
const db = require('./src/models');

const PORT = process.env.PORT || 3000;

// Hàm chính để kết nối DB và khởi động server
const start = async () => {
    try {
        // Kiểm tra kết nối database
        await db.sequelize.authenticate();
        console.log('✅ Connection to the database has been established successfully.');

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

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
};

// Gọi hàm chính để bắt đầu mọi thứ
start();