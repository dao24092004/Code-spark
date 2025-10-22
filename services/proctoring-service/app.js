const express = require('express');
const cors = require('cors');

// 1. IMPORT THÊM:
// Dòng này "nạp" file proctoring.routes.js vào,
// để app.js biết về sự tồn tại của các "bảng chỉ đường" mới.
const proctoringRoutes = require('./src/routes/proctoring.routes.js');

// Khởi tạo app Express
const app = express();

// === CÀI ĐẶT MIDDLEWARE ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === ROUTE KIỂM TRA CƠ BẢN ===
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Proctoring Service. We are live!' });
});

// 2. SỬ DỤNG ROUTE (THÊM VÀO ĐÂY):
// Dòng này bảo với Express: "Nếu có bất kỳ request nào có URL
// bắt đầu bằng '/api', hãy chuyển nó đến cho proctoringRoutes xử lý."
// Ví dụ: /api/sessions/abc/events sẽ được chuyển đến đây.
- app.use('/api', proctoringRoutes);
+ app.use('/api/proctoring', proctoringRoutes);

// === XUẤT APP ĐỂ SERVER.JS SỬ DỤNG ===
module.exports = app;

