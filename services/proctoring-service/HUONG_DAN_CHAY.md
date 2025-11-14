# Hướng dẫn Chạy Proctoring Service

## 🚀 Cách 1: Sử dụng Script Batch (Dễ nhất - Windows)

### Khởi động Service:
```bash
# Double-click hoặc chạy trong terminal:
start.bat
```

### Dừng Service:
```bash
stop.bat
```

### Khởi động lại:
```bash
restart.bat
```

## 🚀 Cách 2: Sử dụng npm scripts

### Khởi động (Production):
```bash
cd services/proctoring-service
npm start
```

### Khởi động (Development với auto-reload):
```bash
cd services/proctoring-service
npm run dev
```

## 🚀 Cách 3: Chạy trực tiếp với Node.js

```bash
cd services/proctoring-service
node server.js
```

## ✅ Kiểm tra Service đã chạy

### 1. Kiểm tra Port:
```bash
netstat -ano | findstr :8082
```

### 2. Test API:
```bash
# Test qua Gateway
curl http://localhost:8080/api/proctoring/test

# Test trực tiếp
curl http://localhost:8082/
```

### 3. Kiểm tra trong Browser:
- Gateway: http://localhost:8080/api/proctoring/test
- Direct: http://localhost:8082/

## 🔧 Xử lý lỗi Port đã được sử dụng

Nếu gặp lỗi `EADDRINUSE: address already in use 0.0.0.0:8082`:

### Cách 1: Dùng script stop.bat
```bash
stop.bat
```

### Cách 2: Tìm và dừng thủ công
```bash
# Tìm process đang dùng port 8082
netstat -ano | findstr :8082

# Dừng process (thay PID bằng số thực tế)
taskkill /F /PID <PID>
```

### Cách 3: Đổi port trong .env
```env
PORT=8083
```

## 📋 Yêu cầu trước khi chạy

1. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình .env file:**
   - Tạo file `.env` trong thư mục `proctoring-service`
   - Cấu hình các biến môi trường cần thiết:
   ```env
   PORT=8082
   DB_HOST=localhost
   DB_PORT=5433
   DB_USER=postgres
   DB_PASSWORD=password
   DB_NAME=proctoring_db
   JWT_SECRET=your-secret-key
   EUREKA_HOST=localhost
   EUREKA_PORT=9999
   ```

3. **Đảm bảo các service phụ thuộc đang chạy:**
   - PostgreSQL database
   - Eureka Discovery Service (port 9999)
   - AI Service (port 8000) - nếu cần phân tích frame

## 🌐 Sau khi chạy thành công

Service sẽ:
- ✅ Lắng nghe HTTP trên port 8082
- ✅ Lắng nghe WebSocket trên `ws://localhost:8082/ws`
- ✅ Đăng ký với Eureka Discovery Service
- ✅ Có thể truy cập qua API Gateway tại `http://localhost:8080/api/proctoring/...`

## 📝 Logs

Khi service chạy, bạn sẽ thấy các log:
```
🚀 Proctoring Service HTTP listening at http://localhost:8082
🌐 Proctoring Service WebSocket listening at ws://localhost:8082/ws
✅ Proctoring Service registered with Eureka
✅ Database connection established
✅ Database models synchronized
```

## 🧪 Test Service

Sau khi chạy, test bằng:
```bash
# Chạy script test tự động
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

Xem chi tiết trong file `TEST_GUIDE.md`

