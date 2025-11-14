# Hướng dẫn Test Proctoring Service

## 1. Test cơ bản (Không cần authentication)

### Test qua API Gateway (Port 8080)
```bash
# Test endpoint đơn giản
curl http://localhost:8080/api/proctoring/test

# Test root endpoint
curl http://localhost:8080/api/proctoring/
```

### Test trực tiếp (Port 8082)
```bash
# Test root endpoint
curl http://localhost:8082/

# Test WebSocket endpoint info
curl http://localhost:8082/ws
```

## 2. Test Analyze Frame (Không cần auth)

```bash
curl -X POST http://localhost:8080/api/proctoring/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "examId": "exam-123",
    "studentId": "student-456",
    "sessionId": "session-789"
  }'
```

## 3. Test Start Monitoring Session (Cần JWT Token)

```bash
# Lấy token từ identity service trước
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:8080/api/proctoring/sessions/start-monitoring \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "examId": "exam-123",
    "userId": "user-456"
  }'
```

## 4. Test Get Events (Cần JWT Token)

```bash
TOKEN="your-jwt-token-here"
SESSION_ID="session-123"

curl -X GET http://localhost:8080/api/proctoring/sessions/$SESSION_ID/events \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Test bằng PowerShell Script

Chạy script tự động:
```powershell
cd services/proctoring-service
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

## 6. Test WebSocket Connection

Sử dụng tool như Postman, WebSocket King, hoặc code JavaScript:

```javascript
const socket = io('ws://localhost:8080/ws', {
  query: {
    examId: 'exam-123',
    userId: 'user-456',
    userType: 'student'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('welcome', (data) => {
  console.log('Welcome:', data);
});
```

## 7. Kiểm tra Service Discovery

Kiểm tra service đã đăng ký với Eureka:
- Truy cập: http://localhost:9999
- Tìm service: `PROCTORING-SERVICE`

## Endpoints Summary

| Endpoint | Method | Auth | Gateway Path | Direct Path |
|----------|--------|------|--------------|-------------|
| Test | GET | No | `/api/proctoring/test` | `/test` |
| Root | GET | No | `/api/proctoring/` | `/` |
| Analyze Frame | POST | No | `/api/proctoring/analyze-frame` | `/api/proctoring/analyze-frame` |
| Start Monitoring | POST | Yes | `/api/proctoring/sessions/start-monitoring` | `/api/proctoring/sessions/start-monitoring` |
| Get Events | GET | Yes | `/api/proctoring/sessions/:sessionId/events` | `/api/proctoring/sessions/:sessionId/events` |
| WebSocket | WS | No | `ws://localhost:8080/ws` | `ws://localhost:8082/ws` |

