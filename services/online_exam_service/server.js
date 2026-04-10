const express = require('express');
const http = require('http'); // THÊM: HTTP module cho WebSocket
const cors = require('cors');
const path = require('path');
const config = require('./src/config');

const db = require('./src/models');
const mainRouter = require('./src/routes'); // <-- 1. IMPORT ROUTER CHÍNH
const { initializeWebSocket } = require('./src/config/websocket'); // THÊM: WebSocket config

// ===============================================
// 1. IMPORT KAFKA PRODUCER Ở ĐÂY
// ===============================================
const { connectProducer } = require('./src/services/notification.producer');

const app = express();
const PORT = process.env.PORT || config.server.port || 3000;

// ===== ERROR HANDLERS TOÀN CỤC =====
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('warning', (warning) => {
  console.warn('⚠️ Warning:', warning.name, warning.message);
});

// Middleware để đọc JSON từ body của request
app.use(express.json());

// --- [BƯỚC QUAN TRỌNG: DEBUG LOG] ---
// Đoạn này sẽ giúp bạn nhìn thấy Gateway đang gửi cái gì sang
app.use((req, res, next) => {
    console.log('\n--- 🚀 [INCOMING REQUEST] ---');
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
    console.log(`Path thực tế Nodejs nhận: ${req.path}`);
    console.log(`Headers Authorization: ${req.headers['authorization'] ? '✅ OK' : '❌ Trống'}`);
    console.log('------------------------------');
    next();
});

// Trang chào mừng
app.get('/', (req, res) => {
  res.json({
    service: 'Online Exam Service',
    status: 'running',
    timestamp: new Date().toISOString(),
    debug: "Nếu bạn thấy log này, route '/' đang chạy đúng"
  });
});

// SỬ DỤNG ROUTER
// Chúng ta dùng '/' vì Gateway thường đã rewrite URL rồi
app.use('/', mainRouter);

// Tạo HTTP server để hỗ trợ WebSocket
const httpServer = http.createServer(app);

// Khởi tạo WebSocket
initializeWebSocket(httpServer);

// Khởi động server
httpServer.listen(PORT, async () => {
  console.log(`\n🚀 Online Exam Service đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔑 JWT Secret đang dùng: ${config.security.jwt.secret === 'change-me-in-production' ? '⚠️ MẶC ĐỊNH (Coi chừng lỗi)' : '✅ ĐÃ LOAD TỪ ENV'}`);
  
  try {
    await db.sequelize.authenticate();
    console.log('✅ Kết nối Database thành công.');
  } catch (error) {
    console.error('❌ Lỗi kết nối Database:', error);
  }

  // ===============================================
  // 2. GỌI HÀM KẾT NỐI KAFKA NGAY SAU KHI SERVER CHẠY LÊN
  // ===============================================
  await connectProducer();
});

// Xử lý lỗi khi server không thể khởi động
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} đã được sử dụng!`);
  } else {
    console.error('❌ Lỗi server:', error);
  }
});

// Đóng server an toàn
const gracefulShutdown = (signal) => {
  console.log(`\n👋 Nhận tín hiệu ${signal}: đang đóng server...`);
  httpServer.close(() => {
    console.log('✅ Server đã đóng hoàn toàn.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));