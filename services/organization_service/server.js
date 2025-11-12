require('dotenv').config();
const express = require('express');

// Import các kết nối Sequelize
const { 
  profileDbSequelize, 
  identityDbSequelize, 
  courseDbSequelize 
} = require('./src/config/db');

// Import config (để lấy port)
const config = require('./src/config');

// Import router chính (sẽ được điền code ở bước sau)
const mainRouter = require('./src/routes'); 

// --- HÀM KIỂM TRA KẾT NỐI DB (DÙNG SEQUELIZE) ---
async function checkDatabaseConnections() {
  console.log('Đang kiểm tra kết nối Database (dùng Sequelize)...');
  try {
    await profileDbSequelize.authenticate();
    console.log('✅ Kết nối thành công đến [profile_db]');
    
    await identityDbSequelize.authenticate();
    console.log('✅ Kết nối thành công đến [identity_db]');
    
    await courseDbSequelize.authenticate();
    console.log('✅ Kết nối thành công đến [course_db]');
    
    return true;
  } catch (error) {
    console.error('❌ LỖI kết nối DB:', error.message);
    return false;
  }
}
// --- KẾT THÚC HÀM KIỂM TRA ---

const app = express();
const PORT = config.port; // Lấy port từ file config

app.use(express.json()); // Middleware để đọc JSON body

// --- SỬ DỤNG ROUTER CHÍNH ---
// Tất cả API sẽ có dạng /api/v1/...
app.use('/api/v1', mainRouter);

// --- HÀM CHẠY SERVER ---
async function startServer() {
  const allDatabasesConnected = await checkDatabaseConnections();
  if (allDatabasesConnected) {
    app.listen(PORT, () => {
      console.log(`🚀 Service 8 (Organization) đang chạy trên port ${PORT}`);
    });
  } else {
    console.error('❌ Không thể khởi động server do lỗi kết nối DB.');
    process.exit(1);
  }
}

startServer();