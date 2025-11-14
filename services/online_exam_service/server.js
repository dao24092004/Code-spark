// file: server.js

const express = require('express');

const cors = require('cors');
const config = require('./src/config');

const db = require('./src/models');
const mainRouter = require('./src/routes'); // <-- 1. IMPORT ROUTER CHÍNH

const app = express();
const PORT = process.env.PORT || config.server.port || 3000;

// ===== ERROR HANDLERS TOÀN CỤC =====
// Xử lý unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  // Không tắt server, chỉ log lỗi
});

// Xử lý uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Không tắt server, chỉ log lỗi
});

// Xử lý warning
process.on('warning', (warning) => {
  console.warn('⚠️ Warning:', warning.name, warning.message);
});


// CORS middleware - cho phép API Gateway và frontend truy cập
app.use(cors({
  origin: [
    'http://localhost:8080',  // API Gateway
    'http://localhost:4173',  // Frontend
    'http://localhost:5173',  // Frontend dev
    'http://localhost:8083'   // Other services
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Service-Name']
}));

app.get('/', (req, res) => {
  res.json({
    service: 'Online Exam Service',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});
// Đảm bảo dòng này tồn tại
app.use('/api/exam', mainRouter);  // Không có 's' sau exam
// Middleware để đọc JSON từ body của request
app.use(express.json());

// <-- 2. SỬ DỤNG ROUTER VỚI PREFIX '/api'
// Dòng này nói với Express: "Mọi request đến '/api' hãy đưa cho mainRouter xử lý"
app.use('/api/exam', mainRouter);

// Khởi động server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Exam Service đang chạy trên cổng ${PORT}`);
  
  try {
    await db.sequelize.authenticate();
    console.log('✅ Kết nối Database thành công.');
    
    // Sync database (optional - tạo bảng nếu chưa có)
    // await db.sequelize.sync({ alter: false });
    // console.log('✅ Database đã được đồng bộ.');
  } catch (error) {
    console.error('❌ Lỗi kết nối Database:', error);
    console.error('Stack trace:', error.stack);
  }
});

// Xử lý lỗi khi server không thể khởi động
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} đã được sử dụng!`);
  } else {
    console.error('❌ Lỗi server:', error);
  }
});

// Giữ process alive
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});