// file: server.js

const express = require('express');
const config = require('./src/config');
const db = require('./src/models');
const mainRouter = require('./src/routes'); // <-- 1. IMPORT ROUTER CHÍNH

const app = express();
const PORT = config.serverPort;

// Middleware để đọc JSON từ body của request
app.use(express.json());

// <-- 2. SỬ DỤNG ROUTER VỚI PREFIX '/api'
// Dòng này nói với Express: "Mọi request đến '/api' hãy đưa cho mainRouter xử lý"
app.use('/api', mainRouter);

app.listen(PORT, async () => {
  console.log(`🚀 Exam Service đang chạy trên cổng ${PORT}`);
  
  try {
    await db.sequelize.authenticate();
    console.log('✅ Kết nối Database thành công.');
  } catch (error) {
    console.error('❌ Lỗi kết nối Database:', error);
  }
});