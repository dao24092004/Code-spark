// --- Các dòng import cần thiết ---
require('dotenv').config(); // ✅ Thêm dòng này để đọc file .env
const http = require('http'); // 1. IMPORT THÊM: Module http gốc của Node.js
const app = require('./app'); // Express app của chúng ta
const db = require('./src/models');
const config = require('./src/config/');
const { initializeWebSocket } = require('./src/config/websocket.js'); // 2. IMPORT THÊM: "Bộ cài đặt" WebSocket

const PORT = config.server.port || process.env.PORT || 8082; // ✅ Cho fallback khi chưa có config

// --- Nâng cấp quy trình khởi động ---

// 3. THAY ĐỔI: Thay vì để app.listen(), chúng ta chủ động tạo một HTTP server.
// Điều này cho chúng ta quyền kiểm soát để gắn thêm các dịch vụ khác (như WebSocket) vào.
const httpServer = http.createServer(app);

// 4. THÊM MỚI: Gọi hàm "cài đặt" WebSocket mà chúng ta đã tạo ở file websocket.js.
// Chúng ta đưa httpServer vào để WebSocket biết phải "chạy nhờ" ở đâu.
initializeWebSocket(httpServer);

// 5. THAY ĐỔI: Bây giờ, chúng ta sẽ cho httpServer lắng nghe, không phải app.
httpServer.listen(PORT, async () => {
  try {
    // ✅ Thử kết nối DB
    await db.sequelize.authenticate();
    console.log('✅ Kết nối database thành công.');

    await db.sequelize.sync({ force: false });
    console.log('✅ Tất cả models đã được đồng bộ thành công.');
  } catch (error) {
    console.error('❌ Không thể kết nối hoặc đồng bộ database:', error);
  }

  console.log(`🌐 Service Giám sát (HTTP + WebSocket) đang chạy trên cổng ${PORT}.`);
});

// --- Cập nhật quy trình tắt server ---
process.on('SIGINT', () => {
  console.log('\n🛑 Đang tắt Service Giám sát...');
  db.sequelize.close();
  httpServer.close(() => {
    console.log('🟢 Server đã tắt.');
    process.exit(0);
  });
});