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

// Increase body size limits to accept base64 screenshots from the frontend
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Middleware để log tất cả requests (để debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path.includes('analyze-frame')) {
    console.log('[REQUEST DEBUG] Body keys:', Object.keys(req.body || {}));
    console.log('[REQUEST DEBUG] Has image:', !!req.body?.image);
  }
  next();
});

// === ROUTE KIỂM TRA CƠ BẢN ===
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Proctoring Service. We are live!' });
});

// Route test để kiểm tra xem server có nhận request không
app.get('/api/proctoring/test', (req, res) => {
  res.json({ message: 'Proctoring service is working!', timestamp: new Date().toISOString() });
});

// 2. SỬ DỤNG ROUTE (THÊM VÀO ĐÂY):
// Dòng này bảo với Express: "Nếu có bất kỳ request nào có URL
// bắt đầu bằng '/api/proctoring', hãy chuyển nó đến cho proctoringRoutes xử lý."
// Ví dụ: /api/proctoring/sessions/abc/events sẽ được chuyển đến đây.
app.use('/api/proctoring', proctoringRoutes);

// === ERROR HANDLING MIDDLEWARE ===
// Phải đặt sau tất cả routes để catch errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[JSON ERROR] Invalid JSON:', err.message);
    return res.status(400).json({ 
      message: 'Invalid JSON format', 
      error: err.message 
    });
  }
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// === XUẤT APP ĐỂ SERVER.JS SỬ DỤNG ===
module.exports = app;